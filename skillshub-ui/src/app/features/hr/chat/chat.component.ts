import { Component, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse, SearchResponse, SearchResultItem } from '../../../core/models/models';

interface ChatTurn {
  id: number;
  query: string;
  results: SearchResultItem[];
  loading: boolean;
  error: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
          </svg>
        </div>
        <div>
          <h1>Conversational Search</h1>
          <p>Ask anything in plain English — AI finds matching employees from your talent pool.</p>
        </div>
        @if (turns().length > 0) {
          <button class="btn-clear" (click)="clearChat()">Clear chat</button>
        }
      </div>

      <!-- Chat history -->
      <div class="chat-container" #chatContainer>
        @if (turns().length === 0) {
          <div class="welcome">
            <div class="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
            </div>
            <h2>How can I help you find talent?</h2>
            <p>Try asking something like:</p>
            <div class="suggestions">
              @for (s of suggestions; track s) {
                <button class="suggestion-chip" (click)="sendSuggestion(s)">{{ s }}</button>
              }
            </div>
          </div>
        }

        @for (turn of turns(); track turn.id) {
          <!-- User message -->
          <div class="turn">
            <div class="user-bubble">
              <span class="user-label">You</span>
              <div class="user-msg">{{ turn.query }}</div>
              <span class="turn-time">{{ turn.timestamp | date:'h:mm a' }}</span>
            </div>

            <!-- AI response -->
            <div class="ai-bubble">
              <div class="ai-label">
                <span class="ai-badge">AI</span>
                <span>SkillsHub</span>
              </div>
              @if (turn.loading) {
                <div class="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              } @else if (turn.error) {
                <div class="error-msg">{{ turn.error }}</div>
              } @else if (turn.results.length === 0) {
                <p class="no-results">No matching employees found for this query. Try rephrasing or using different keywords.</p>
              } @else {
                <p class="result-summary">Found <strong>{{ turn.results.length }}</strong> matching employee{{ turn.results.length !== 1 ? 's' : '' }} for "{{ turn.query }}"</p>
                <div class="result-cards">
                  @for (r of turn.results; track r.profileId; let i = $index) {
                    <a class="result-card" [routerLink]="['/hr/profile', r.profileId]">
                      <div class="card-rank" [class]="rankClass(i)">{{ i + 1 }}</div>
                      <div class="card-avatar">{{ r.fullName[0] }}</div>
                      <div class="card-info">
                        <span class="card-name">{{ r.fullName }}</span>
                        <span class="card-title">{{ r.currentTitle }}{{ r.department ? ' · ' + r.department : '' }}</span>
                        @if (r.topSkills.length > 0) {
                          <div class="card-skills">
                            @for (s of r.topSkills.slice(0,3); track s) {
                              <span class="card-skill">{{ s }}</span>
                            }
                          </div>
                        }
                      </div>
                      <div class="card-score" [class]="scoreClass(r.score)">{{ r.score.toFixed(0) }}%</div>
                    </a>
                  }
                </div>
                @if (turn.results[0]?.reasoning) {
                  <div class="reasoning-block">
                    <span class="reasoning-label">AI Reasoning</span>
                    <p class="reasoning-text">{{ turn.results[0].reasoning }}</p>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      <!-- Input bar -->
      <div class="input-bar">
        <div class="input-wrap" [class.focused]="inputFocused">
          <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/></svg>
          <input [(ngModel)]="inputText" [placeholder]="listening() ? 'Listening...' : 'Ask about skills, roles, experience...'"
                 class="input-field"
                 (focus)="inputFocused=true" (blur)="inputFocused=false"
                 (keyup.enter)="sendMessage()" />
          <button class="btn-mic" (click)="toggleVoice()" [class.listening]="listening()"
                  [title]="listening() ? 'Stop listening' : 'Voice search'" [attr.aria-label]="listening() ? 'Stop voice input' : 'Start voice input'">
            @if (listening()) {
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            }
          </button>
          <button class="btn-send" (click)="sendMessage()"
                  [disabled]="!inputText.trim() || isLoading()">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </div>
        @if (listening()) {
          <div class="voice-status">
            <span class="voice-dot"></span>
            Listening — speak your query now...
          </div>
        } @else {
          <p class="input-hint">Powered by semantic AI search · Results are from your approved talent pool</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:860px; margin:0 auto; padding:2rem 1.5rem; display:flex; flex-direction:column; height:calc(100vh - 0px); box-sizing:border-box; }
    .page-header { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1.25rem; flex-shrink:0; }
    .header-icon { width:48px; height:48px; background:linear-gradient(135deg,#7c3aed,#4f46e5); border-radius:12px; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; box-shadow:0 4px 12px rgba(124,58,237,.3); }
    .header-icon svg { width:24px; height:24px; }
    h1 { font-size:1.4rem; font-weight:700; color:#0f172a; margin:0 0 .25rem; }
    .page-header p { color:#64748b; font-size:.9rem; margin:0; }
    .btn-clear { margin-left:auto; padding:.35rem .8rem; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:7px; font-size:.78rem; color:#64748b; cursor:pointer; white-space:nowrap; align-self:center; }
    .btn-clear:hover { background:#fee2e2; color:#dc2626; border-color:#fca5a5; }

    .chat-container { flex:1; overflow-y:auto; margin-bottom:1rem; padding-right:.25rem; }

    .welcome { text-align:center; padding:3rem 1rem; }
    .welcome-icon { width:64px; height:64px; background:linear-gradient(135deg,#7c3aed,#4f46e5); border-radius:16px; display:flex; align-items:center; justify-content:center; color:white; margin:0 auto 1rem; }
    .welcome-icon svg { width:32px; height:32px; }
    .welcome h2 { font-size:1.2rem; font-weight:700; color:#0f172a; margin:0 0 .4rem; }
    .welcome p { color:#64748b; font-size:.9rem; margin:0 0 1rem; }
    .suggestions { display:flex; flex-wrap:wrap; gap:.5rem; justify-content:center; }
    .suggestion-chip { padding:.45rem .9rem; background:white; border:1.5px solid #e2e8f0; border-radius:9999px; font-size:.83rem; color:#374151; cursor:pointer; font-family:inherit; transition:.15s; }
    .suggestion-chip:hover { border-color:#4f46e5; color:#4f46e5; background:#f5f3ff; }

    .turn { margin-bottom:1.5rem; }
    .user-bubble { display:flex; flex-direction:column; align-items:flex-end; gap:.15rem; margin-bottom:.75rem; }
    .user-label { font-size:.72rem; color:#94a3b8; font-weight:600; }
    .user-msg { background:#4f46e5; color:white; padding:.65rem 1rem; border-radius:12px 12px 2px 12px; font-size:.9rem; max-width:80%; word-break:break-word; }
    .turn-time { font-size:.65rem; color:#cbd5e1; }

    .ai-bubble { background:white; border:1px solid #e2e8f0; border-radius:2px 12px 12px 12px; padding:1rem 1.25rem; }
    .ai-label { display:flex; align-items:center; gap:.4rem; margin-bottom:.75rem; font-size:.78rem; font-weight:600; color:#4f46e5; }
    .ai-badge { background:linear-gradient(135deg,#7c3aed,#4f46e5); color:white; padding:.1rem .35rem; border-radius:4px; font-size:.65rem; font-weight:800; letter-spacing:.04em; }
    .typing-indicator { display:flex; gap:.35rem; padding:.25rem 0; }
    .typing-indicator span { width:8px; height:8px; background:#cbd5e1; border-radius:50%; animation:bounce .8s infinite; }
    .typing-indicator span:nth-child(2) { animation-delay:.15s; }
    .typing-indicator span:nth-child(3) { animation-delay:.3s; }
    @keyframes bounce { 0%,80%,100%{transform:scale(.8);opacity:.5} 40%{transform:scale(1.2);opacity:1} }
    .error-msg { color:#dc2626; font-size:.875rem; }
    .no-results { color:#64748b; font-size:.875rem; margin:0; }
    .result-summary { font-size:.85rem; color:#64748b; margin:0 0 .75rem; }

    .result-cards { display:flex; flex-direction:column; gap:.4rem; margin-bottom:.75rem; }
    .result-card { display:flex; align-items:center; gap:.75rem; padding:.65rem .875rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; transition:.15s; }
    .result-card:hover { border-color:#4f46e5; background:#f5f3ff; }
    .card-rank { width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:800; flex-shrink:0; }
    .rank-gold { background:#fef9c3; color:#92400e; border:1.5px solid #fde68a; }
    .rank-silver { background:#f1f5f9; color:#475569; border:1.5px solid #cbd5e1; }
    .rank-bronze { background:#fef3c7; color:#b45309; border:1.5px solid #fcd34d; }
    .rank-default { background:#f1f5f9; color:#64748b; border:1.5px solid #e2e8f0; }
    .card-avatar { width:34px; height:34px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:.875rem; font-weight:700; flex-shrink:0; }
    .card-info { flex:1; min-width:0; }
    .card-name { display:block; font-size:.875rem; font-weight:600; color:#0f172a; }
    .card-title { display:block; font-size:.75rem; color:#64748b; margin-top:.1rem; }
    .card-skills { display:flex; gap:.25rem; flex-wrap:wrap; margin-top:.25rem; }
    .card-skill { font-size:.7rem; background:#ede9fe; color:#6d28d9; padding:.1rem .4rem; border-radius:4px; }
    .card-score { font-size:.82rem; font-weight:700; padding:.2rem .5rem; border-radius:5px; flex-shrink:0; }
    .score-high { background:#dcfce7; color:#166534; }
    .score-mid { background:#fef9c3; color:#92400e; }
    .score-low { background:#fee2e2; color:#dc2626; }

    .reasoning-block { background:#f5f3ff; border:1px solid #ede9fe; border-radius:8px; padding:.75rem 1rem; }
    .reasoning-label { font-size:.7rem; font-weight:700; color:#7c3aed; letter-spacing:.06em; text-transform:uppercase; display:block; margin-bottom:.3rem; }
    .reasoning-text { font-size:.83rem; color:#4b5563; margin:0; line-height:1.55; }

    .input-bar { flex-shrink:0; }
    .input-wrap { display:flex; align-items:center; gap:.5rem; background:white; border:1.5px solid #e2e8f0; border-radius:12px; padding:.5rem .5rem .5rem .875rem; box-shadow:0 2px 8px rgba(0,0,0,.06); transition:.15s; }
    .input-wrap.focused { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,.1); }
    .input-icon { width:18px; height:18px; color:#94a3b8; flex-shrink:0; }
    .input-field { flex:1; border:none; font-size:.95rem; font-family:inherit; color:#0f172a; }
    .input-field:focus { outline:none; }
    .input-field::placeholder { color:#94a3b8; }
    .btn-send { width:38px; height:38px; background:#4f46e5; border:none; border-radius:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0; transition:.15s; }
    .btn-send:hover:not(:disabled) { background:#4338ca; }
    .btn-send:disabled { opacity:.4; cursor:not-allowed; }
    .btn-send svg { width:16px; height:16px; }
    .btn-mic { width:38px; height:38px; background:#f1f5f9; border:1.5px solid #e2e8f0; border-radius:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#64748b; flex-shrink:0; transition:.15s; }
    .btn-mic svg { width:18px; height:18px; }
    .btn-mic:hover { background:#ede9fe; border-color:#a5b4fc; color:#4f46e5; }
    .btn-mic.listening { background:#fee2e2; border-color:#fca5a5; color:#dc2626; animation:mic-pulse 1s ease-in-out infinite; }
    @keyframes mic-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)} 50%{box-shadow:0 0 0 6px rgba(220,38,38,0)} }
    .input-hint { font-size:.72rem; color:#94a3b8; text-align:center; margin:.45rem 0 0; }
    .voice-status { display:flex; align-items:center; gap:.5rem; font-size:.78rem; color:#dc2626; font-weight:600; margin:.4rem 0 0; justify-content:center; }
    .voice-dot { width:8px; height:8px; background:#dc2626; border-radius:50%; animation:mic-pulse 1s ease-in-out infinite; }
  `]
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  inputText = '';
  inputFocused = false;
  listening = signal(false);
  turns = signal<ChatTurn[]>([]);
  private nextId = 1;
  private shouldScroll = false;
  private recognition: any = null;

  suggestions = [
    'Find senior React developers with 5+ years experience',
    'Who knows AWS and has DevOps experience?',
    'Python engineers with machine learning skills',
    'Full-stack developers available for a new project',
    'Who has experience with microservices architecture?'
  ];

  isLoading = () => this.turns().some(t => t.loading);

  constructor(private http: HttpClient) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendSuggestion(text: string) {
    this.inputText = text;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;
    this.inputText = '';

    const turn: ChatTurn = {
      id: this.nextId++,
      query: text,
      results: [],
      loading: true,
      error: '',
      timestamp: new Date()
    };
    this.turns.update(list => [...list, turn]);
    this.shouldScroll = true;

    this.http.post<ApiResponse<SearchResponse>>(`${environment.apiUrl}/search`, { query: text, topK: 5 }).subscribe({
      next: res => {
        this.turns.update(list => list.map(t => t.id === turn.id
          ? { ...t, loading: false, results: res.data?.results ?? [] }
          : t));
        this.shouldScroll = true;
      },
      error: () => {
        this.turns.update(list => list.map(t => t.id === turn.id
          ? { ...t, loading: false, error: 'Search failed. Please try again.' }
          : t));
        this.shouldScroll = true;
      }
    });
  }

  clearChat() { this.turns.set([]); }

  toggleVoice() {
    if (this.listening()) {
      this.recognition?.stop();
      this.listening.set(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice search is not supported in this browser. Try Chrome.'); return; }
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.onresult = (e: any) => {
      this.inputText = e.results[0][0].transcript;
      this.listening.set(false);
      this.sendMessage();
    };
    this.recognition.onerror = () => this.listening.set(false);
    this.recognition.onend = () => this.listening.set(false);
    this.listening.set(true);
    this.recognition.start();
  }

  private scrollToBottom() {
    try {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  rankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-default';
  }

  scoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-mid';
    return 'score-low';
  }
}
