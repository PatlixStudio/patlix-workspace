import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Companion } from '../../core/models/companion';
import { ChatMessage } from '../../core/models/chat';
import { CompanionsApiService } from '../../core/services/companions-api.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  companion = signal<Companion | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  isLoading = signal(false);
  error = signal<string | null>(null);
  isTyping = signal(false);
  voiceEnabled = signal(true);
  speakingId = signal<string | null>(null);
  showLoginBanner = signal(false);
  showPremiumBanner = signal(false);

  private audio: HTMLAudioElement | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly companionsApi = inject(CompanionsApiService);
  private readonly chatService = inject(ChatService);
  protected readonly auth = inject(AuthService);

  avatarUrl = computed(() => {
    const c = this.companion();
    if (!c) return '';
    return `/assets/companions/${c.id}/profile/${c.id}-profile.png`;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCompanion(id);
    }
  }

  ngOnDestroy(): void {
    this.chatService.clearCurrentSession();
    this.stopAudio();
  }

  /** Toggles automatic voice playback of assistant replies. */
  toggleVoice(): void {
    const next = !this.voiceEnabled();
    this.voiceEnabled.set(next);
    if (!next) this.stopAudio();
  }

  /**
   * Plays (or stops) a message's voice using the companion's unique TTS voice.
   */
  async speakMessage(msg: ChatMessage): Promise<void> {
    if (this.speakingId() === msg.id) {
      this.stopAudio();
      return;
    }
    await this.playVoice(msg.id, msg.content);
  }

  private async playVoice(messageId: string, text: string): Promise<void> {
    const companion = this.companion();
    if (!companion) return;
    try {
      this.stopAudio();
      this.speakingId.set(messageId);
      const url = await this.chatService.speak(companion.id, text);
      this.audio = new Audio(url);
      this.audio.onended = () => this.stopAudio();
      this.audio.onerror = () => this.stopAudio();
      await this.audio.play();
    } catch (err) {
      console.error('Voice playback failed:', err);
      this.stopAudio();
    }
  }

  private stopAudio(): void {
    this.audio?.pause();
    this.audio = null;
    const id = this.speakingId();
    if (id) this.speakingId.set(null);
  }

  private checkForBanners(response: string): void {
    const lower = response.toLowerCase();
    if (lower.includes('please log in') || lower.includes('to know you better')) {
      this.showLoginBanner.set(true);
    }
    if (lower.includes('premium') && (lower.includes('upgrade') || lower.includes('unlock'))) {
      this.showPremiumBanner.set(true);
    }
  }

  goLogin(): void {
    void this.router.navigate(['/login']);
  }

  goPremium(): void {
    void this.router.navigate(['/profile']);
  }

  dismissLoginBanner(): void {
    this.showLoginBanner.set(false);
  }

  dismissPremiumBanner(): void {
    this.showPremiumBanner.set(false);
  }

  private async loadCompanion(id: string): Promise<void> {
    try {
      const companion = await firstValueFrom(this.companionsApi.get(id));
      this.companion.set(companion);
      this.loadChatHistory(id);
    } catch (err) {
      this.error.set('Failed to load companion');
      console.error(err);
    }
  }

  private async loadChatHistory(companionId: string): Promise<void> {
    try {
      const history = await this.chatService.getHistory(companionId);
      this.messages.set(history);
      this.scrollToBottom();
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.isLoading()) return;

    const companion = this.companion();
    if (!companion) return;

    this.newMessage = '';
    this.isLoading.set(true);
    this.error.set(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, userMessage]);

    try {
      // Show the typing indicator immediately, then scroll past the new message.
      this.isTyping.set(true);
      this.scrollToBottom();
      const response = await this.chatService.sendMessage(companion.id, text, this.messages());
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      this.messages.update((msgs) => [...msgs, assistantMessage]);
      this.scrollToBottom();
      this.checkForBanners(response);

      if (this.voiceEnabled()) {
        void this.playVoice(assistantMessage.id, response);
      }
    } catch (err) {
      this.error.set('Failed to send message. Please try again.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
      this.isTyping.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/placeholder-avatar.png';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }

  goBack(): void {
    this.router.navigate(['/companions']);
  }

  clearChat(): void {
    if (confirm('Clear chat history with this companion?')) {
      const companion = this.companion();
      if (companion) {
        this.chatService.clearHistory(companion.id);
        this.messages.set([]);
      }
    }
  }

  formatTime(date: Date): string {
    const d = date instanceof Date ? date : new Date(date as unknown as string);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}