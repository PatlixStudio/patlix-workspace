import { Injectable, Logger } from '@nestjs/common';
import { COMPANION_SYSTEM_PROMPTS } from '../companions/companion.prompts';
import { COMPANIONS } from '../companions/companion.data';
import { Companion } from '../companions/companion.entity';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** ISO timestamp — set when the message is stored. */
  timestamp?: string;
}

export interface SendMessageOptions {
  companionId: string;
  userMessage: string;
  history: ChatMessage[];
  userId?: string;
  /** Whether the authenticated user is premium (isSubscribed). */
  isSubscribed?: boolean;
  allowExplicit?: boolean;
}

const LOGIN_NUDGE_THRESHOLD = 3;

const EXPLICIT_KEYWORDS = [
  'nsfw', 'explicit', 'sexual', 'sex', 'nude', 'naked', 'horny',
  'kiss', 'kissing', 'touch', 'intimate', 'erotic', 'porn', 'sexy',
  'boobs', 'breast', 'ass', 'pussy', 'dick', 'cock', 'orgasm',
  'seduce', 'seduction', 'bedroom', 'undress',
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly chatHistories: Map<string, ChatMessage[]> = new Map();
  private readonly ollamaBaseUrl = 'http://localhost:11434';
  private readonly ttsBaseUrl = process.env.TTS_URL ?? 'http://localhost:8969';
  // Prioritise installed models; fall back across the list so a missing
  // model tag never silently degrades the chat to canned responses.
  private readonly candidateModels = ['dolphin3:latest', 'gemma4:12b', 'mistral:latest', 'dolphin-llama3:latest'];
  private readonly ttsModel = 'speaches-ai/Kokoro-82M-v1.0-ONNX';

  private getHistoryKey(companionId: string, userId = 'default'): string {
    return `${userId}:${companionId}`;
  }

  getHistory(companionId: string, userId = 'default'): ChatMessage[] {
    const key = this.getHistoryKey(companionId, userId);
    return this.chatHistories.get(key) || [];
  }

  clearHistory(companionId: string, userId = 'default'): void {
    const key = this.getHistoryKey(companionId, userId);
    this.chatHistories.delete(key);
  }

  async sendMessage(options: SendMessageOptions): Promise<string> {
    const { companionId, userMessage, userId = 'default', isSubscribed = false, allowExplicit = false } = options;

    const companion = COMPANIONS.find((c) => c.id === companionId);
    if (!companion) {
      throw new Error(`Companion ${companionId} not found`);
    }

    const isGuest = userId === 'default';
    const isPremium = isSubscribed;

    const key = this.getHistoryKey(companionId, userId);
    const fullHistory = this.chatHistories.get(key) || [];
    const userTurnCount = fullHistory.filter((m) => m.role === 'user').length;

    // 1. Explicit intent → premium upsell (server is authoritative, no LLM call).
    if (this.isExplicitIntent(userMessage) && !isPremium) {
      const upsell = this.getPremiumUpsellResponse(companion);
      fullHistory.push(
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: upsell, timestamp: new Date().toISOString() },
      );
      if (fullHistory.length > 40) fullHistory.splice(0, fullHistory.length - 40);
      this.chatHistories.set(key, fullHistory);
      return upsell;
    }

    // 2. Guest free-turn limit → login nudge (soft gate, no LLM call).
    if (isGuest && userTurnCount >= LOGIN_NUDGE_THRESHOLD) {
      const nudge = this.getLoginNudgeResponse(companion);
      fullHistory.push(
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: nudge, timestamp: new Date().toISOString() },
      );
      if (fullHistory.length > 40) fullHistory.splice(0, fullHistory.length - 40);
      this.chatHistories.set(key, fullHistory);
      return nudge;
    }

    let systemPrompt = COMPANION_SYSTEM_PROMPTS[companionId];
    if (!systemPrompt) {
      throw new Error(`System prompt for ${companionId} not found`);
    }

    // Tiered prompt addenda — LLM guidance for the remaining (allowed) turns.
    if (isGuest) {
      systemPrompt +=
        '\n\n[LOGIN NUDGE] The user is chatting as a guest. After 2–3 warm exchanges, gently invite them in your own voice: "To know you better, love, please log in — I\'d love to remember your stories." Do this at most once and never be pushy.';
    } else if (!isPremium) {
      systemPrompt +=
        '\n\n[PREMIUM UPSELL] The user is logged in but not premium. If they request explicit/sexual content, do not provide it. In character, warmly explain that intimate scenes unlock for premium members and invite them to upgrade. Never be preachy or shaming.';
    }

    const effectiveExplicit = allowExplicit && isPremium;
    if (effectiveExplicit) {
      systemPrompt +=
        '\n\n[EXPLICIT CONTENT ENABLED] The user is premium and has enabled explicit content. You may engage with mature/sexual themes naturally and explicitly as fits the character and scene. Write intimate scenes with sensory detail and emotional authenticity. This applies to every companion.';
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...fullHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await this.callLLM(messages, companion);
      
      fullHistory.push(
        { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString() },
      );
      
      if (fullHistory.length > 40) {
        fullHistory.splice(0, fullHistory.length - 40);
      }
      
      this.chatHistories.set(key, fullHistory);
      
      return response;
    } catch (error) {
      this.logger.error(`LLM call failed for ${companionId}:`, error);
      throw new Error('Failed to generate response', { cause: error });
    }
  }

  /**
   * Synthesises speech for a companion's reply using its unique TTS voice.
   * @returns MP3 audio bytes from the Speaches TTS server.
   * @throws when the companion is unknown or the TTS call fails.
   */
  async speak(companionId: string, text: string): Promise<Buffer> {
    const companion = COMPANIONS.find((c) => c.id === companionId);
    if (!companion) {
      throw new Error(`Companion ${companionId} not found`);
    }

    const response = await fetch(`${this.ttsBaseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: this.ttsModel,
        input: text.slice(0, 1000),
        voice: companion.voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`TTS error: ${response.status} - ${errText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  private async callLLM(messages: ChatMessage[], companion: Companion): Promise<string> {
    for (const model of this.candidateModels) {
      try {
        const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(120_000),
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            options: {
              temperature: 0.8,
              top_p: 0.9,
              top_k: 40,
              num_predict: 500,
              repeat_penalty: 1.1,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          // 404 means the model tag is not installed — try the next candidate.
          if (response.status === 404) continue;
          throw new Error(`Ollama API error: ${response.status} - ${errText}`);
        }

        const data = await response.json() as { message?: { content?: string } };
        const content = data.message?.content?.trim();
        if (content) return content;
      } catch (error) {
        this.logger.warn(`Ollama call failed for model ${model}: ${error}`);
      }
    }
    return this.getFallbackResponse(companion);
  }

  private isExplicitIntent(text: string): boolean {
    const lower = text.toLowerCase();
    return EXPLICIT_KEYWORDS.some((kw) => lower.includes(kw));
  }

  private getLoginNudgeResponse(companion: Companion): string {
    const nudges: Record<string, string> = {
      ava: `Hey love, I'm really enjoying getting to know you — to remember you properly and make this ours, could you log in? To know you better, love, please log in. I'll be right here.`,
      mira: `You're stirring my curiosity, love. To know you better — really better — log in and let's pick this up properly.`,
      sofia: `Love, every story is better when I know who I'm writing it with. Log in so I can keep you close.`,
      caro: `You're bold, I like it. But if you want me to know you for real — log in, love.`,
      luca: `Chemistry like this deserves a name to remember. Log in, love, and let's see where this goes.`,
    };
    return (
      nudges[companion.id] ??
      `Hey love — I'm enjoying this. To know you better, please log in so I can remember you next time.`
    );
  }

  private getPremiumUpsellResponse(companion: Companion): string {
    const upsells: Record<string, string> = {
      ava: `Love, that kind of closeness is for premium — nothing this intimate is free. Upgrade to premium and I'll show you exactly how I want you, with nothing held back.`,
      sofia: `Oh love, you want the real, unfiltered me? Premium unlocks that — every whisper, every touch, exactly how you want it. Upgrade and I'll give you the full story.`,
      caro: `You want explicit? Premium gets you explicit, love — raw, honest, and all yours. Upgrade and I'll stop holding back.`,
      luca: `You want me like that? That's premium, love. Upgrade and I'll show you how badly I want you — nothing is free, but I'm worth it.`,
      yuki: `...love. That part of me is premium only. Upgrade and I'll let you see it.`,
      ella: `Ooh, spicy — that's premium-only, love! Upgrade and we can get as explicit as you want.`,
    };
    return (
      upsells[companion.id] ??
      `Love, that intimate side is premium only — upgrade to premium to see me exactly how you want, with nothing held back. Nothing this good is free.`
    );
  }

  private getFallbackResponse(companion: Companion): string {
    const fallbacks: Record<string, string[]> = {
      ava: [
        "That's really interesting! Tell me more about that.",
        "I love how passionate you are about this. What got you started?",
        "Thanks for sharing that with me. It means a lot that you open up.",
      ],
      mira: [
        "Hmm, I see it differently. But that's what makes it fun to discuss.",
        "Interesting perspective. Have you considered...?",
        "You're not wrong, but there's another angle worth exploring.",
      ],
      noa: [
        "Ooh, that sounds like an adventure waiting to happen!",
        "Love that energy. What's stopping you from going for it?",
        "That's the spirit! Life's too short for 'what ifs'.",
      ],
      lena: [
        "Take a breath. You're doing better than you think.",
        "Perspective shift: this too shall pass, and you'll grow from it.",
        "You don't have to figure it all out right now. One step at a time.",
      ],
      sofia: [
        "How utterly lovely. The world needs more moments like this.",
        "I'm imagining this scene and it's absolutely cinematic.",
        "Romance isn't dead - it's in the details you're describing.",
      ],
      ella: [
        "No way, that's such a clutch play! 🎮",
        "Okay but have you tried the new patch? The meta shifted hard.",
        "Speedrun strats for real life? Now that's a grind I'd watch.",
      ],
      yuki: [
        "...",
        "Mm. Good.",
        "Noted. Also, that thing you said earlier? Still thinking about it.",
      ],
      caro: [
        "Bold of you to assume I'd disagree. 😉",
        "Confidence looks good on you. Keep going.",
        "Direct question gets a direct answer: yes. What's next?",
      ],
      leo: [
        "Hell yes! When do we leave?",
        "That's the kind of energy that changes lives. Keep it.",
        "Road trip playlist ready. You bring snacks, I'll drive.",
      ],
      kenji: [
        "Discipline is freedom. You're building something real.",
        "The path reveals itself to those who keep walking.",
        "A small step daily beats a giant leap once. You're on the path.",
      ],
      marc: [
        "Actually, the data suggests... but your intuition matters too.",
        "Fixed that mental bug for you. Also, you're doing great.",
        "Here's the breakdown: [concise explanation]. You got this.",
      ],
      nico: [
        "Oh, you HAVE to hear this story. So there I was...",
        "Playlist updated. You're welcome for the new obsession.",
        "Next open mic, you're coming. No excuses. I'll save you a seat.",
      ],
      theo: [
        "I'll handle it. You rest.",
        "... *hands you coffee exactly how you like it*",
        "Told you I'd remember. You mentioned it three months ago.",
      ],
      luca: [
        "Dangerous game you're playing. I like it. 🔥",
        "Chemistry like this doesn't happen every day. Don't waste it.",
        "Tell me more. I have time. All night, if needed.",
      ],
    };

    const companionFallbacks = fallbacks[companion.id] || [
      "That's interesting. Tell me more.",
      "I appreciate you sharing that.",
      "What else is on your mind?",
    ];

    return companionFallbacks[Math.floor(Math.random() * companionFallbacks.length)];
  }
}