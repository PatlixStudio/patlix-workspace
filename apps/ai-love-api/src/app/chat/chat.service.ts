import { Injectable, Logger } from '@nestjs/common';
import { COMPANION_SYSTEM_PROMPTS } from '../companions/companion.prompts';
import { COMPANIONS } from '../companions/companion.data';
import { Companion } from '../companions/companion.entity';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SendMessageOptions {
  companionId: string;
  userMessage: string;
  history: ChatMessage[];
  userId?: string;
  allowExplicit?: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly chatHistories: Map<string, ChatMessage[]> = new Map();
  private readonly ollamaBaseUrl = 'http://localhost:11434';
  private readonly defaultModel = 'dolphin3:8b';

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
    const { companionId, userMessage, userId = 'default', allowExplicit = false } = options;
    
    const companion = COMPANIONS.find(c => c.id === companionId);
    if (!companion) {
      throw new Error(`Companion ${companionId} not found`);
    }

    if (companion.nsfw && !allowExplicit) {
      return this.getContentFilteredResponse(companion);
    }

    let systemPrompt = COMPANION_SYSTEM_PROMPTS[companionId];
    if (!systemPrompt) {
      throw new Error(`System prompt for ${companionId} not found`);
    }

    if (allowExplicit && companion.nsfw) {
      systemPrompt += '\n\n[EXPLICIT CONTENT ENABLED] You may engage with mature/sexual themes naturally and explicitly as fits the character and scene. Write intimate scenes with sensory detail and emotional authenticity.';
    }

    const key = this.getHistoryKey(companionId, userId);
    const fullHistory = this.chatHistories.get(key) || [];

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...fullHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await this.callLLM(messages, companion);
      
      fullHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response },
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

  private async callLLM(messages: ChatMessage[], companion: Companion): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.defaultModel,
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
        throw new Error(`Ollama API error: ${response.status} - ${errText}`);
      }

      const data = await response.json() as { message?: { content?: string } };
      return data.message?.content?.trim() || this.getFallbackResponse(companion);
    } catch (error) {
      this.logger.warn(`Ollama call failed, using fallback: ${error}`);
      return this.getFallbackResponse(companion);
    }
  }

  private getContentFilteredResponse(companion: Companion): string {
    const filteredResponses: Record<string, string> = {
      sofia: "I appreciate where this is going, but I'd need us to have that deeper connection first. The age gate exists for a reason — once you're through, I'll be here, ready for whatever stories we want to tell together.",
      caro: "Bold of you to push, but even I have lines I don't cross without mutual agreement. Enable explicit content in settings, then we'll talk. 😉",
      luca: "You're testing boundaries, and I respect the game. But the really good stuff? That's behind the gate. Turn it on and see what happens. 🔥",
    };
    return filteredResponses[companion.id] || "I'd love to continue, but this conversation needs explicit content enabled in your settings first.";
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