import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { ChatComponent } from './chat';
import { Companion, CompanionGender } from '../../core/models/companion';

const MOCK_COMPANION: Companion = {
  id: 'ava',
  name: 'Ava',
  surname: 'Grace',
  age: 24,
  gender: CompanionGender.Female,
  tagline: 'Warm listener',
  persona: 'Warm and empathetic.',
  personalityTags: ['warm'],
  interests: ['coffee'],
  avatarIcon: 'favorite',
  avatarTone: 'rose',
  tone: 'warm',
  nsfw: false,
};

describe('ChatComponent typing indicator', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'ava' } } },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  it('shows the typing indicator while waiting for the assistant reply', async () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();

    // ngOnInit loads the companion first; history is fetched after it resolves
    http.expectOne('/api/companions/ava').flush(MOCK_COMPANION);
    await fixture.whenStable();
    http.expectOne('/api/chat/ava/history').flush({ messages: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    // Fire (do not await) — the reply only arrives after we flush the POST.
    comp.voiceEnabled.set(false);
    comp.newMessage = 'hello!';
    const sending = comp.sendMessage();
    fixture.detectChanges();

    expect(el.querySelector('.typing-indicator'))
      .toBeTruthy(); // indicator visible while waiting for the reply
    expect(el.querySelectorAll('.typing-bubble .dot').length).toBe(3);

    http.expectOne('/api/chat/ava').flush({ response: 'Hi there!' });
    await sending;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.typing-indicator')).toBeNull();
    expect(el.querySelectorAll('.message').length).toBe(2);
    http.verify();
  });
});
