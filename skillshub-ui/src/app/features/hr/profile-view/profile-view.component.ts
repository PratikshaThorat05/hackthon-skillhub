import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ProfileResponse } from '../../../core/models/models';

interface SkillRow { name: string; category: string; proficiency: number; years: number | null; }

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/hr/profiles" class="back-link">← Back to Profiles</a>
      @if (loading()) { <div class="loading">Loading profile...</div> }
      @if (profile()) {

        @if (profile()!.status === 'Pending') {
          <div class="review-banner">
            <div class="review-icon">⚠</div>
            <div class="review-text">
              <strong>Pending Review</strong>
              <span>Review the AI-extracted data below and correct any mistakes before approving. You can edit skills inline.</span>
            </div>
            <div class="review-actions">
              <button class="btn-approve-top" (click)="approve()">Approve</button>
              <button class="btn-reject-top" (click)="reject()">Reject</button>
            </div>
          </div>
        }

        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar">{{ profile()!.fullName[0] }}</div>
            <div class="header-info">
              <h2>{{ profile()!.fullName }}</h2>
              <p class="title">{{ profile()!.currentTitle }}{{ profile()!.department ? ' · ' + profile()!.department : '' }}</p>
              <div class="meta-row">
                <span class="status-badge" [class]="profile()!.status.toLowerCase()">{{ profile()!.status }}</span>
                @if (profile()!.availability) {
                  <span class="avail-badge" [class]="profile()!.availability!.toLowerCase().replace(' ', '-')">{{ profile()!.availability }}</span>
                }
                @if (profile()!.location) { <span class="location">📍 {{ profile()!.location }}</span> }
                @if (profile()!.yearsOfExperience) { <span class="years">{{ profile()!.yearsOfExperience }} yrs exp</span> }
                @if (profile()!.linkedInUrl) { <a [href]="profile()!.linkedInUrl" target="_blank" class="linkedin">LinkedIn ↗</a> }
              </div>
            </div>
            <button class="btn-edit" (click)="toggleEdit()">{{ editing() ? 'Cancel' : '✏️ Edit' }}</button>
          </div>

          @if (editing()) {
            <div class="edit-panel">
              <h3>Edit Profile</h3>
              <div class="form-grid">
                <div class="field"><label>Full Name</label><input [(ngModel)]="editData.fullName" /></div>
                <div class="field"><label>Current Title</label><input [(ngModel)]="editData.currentTitle" /></div>
                <div class="field"><label>Department</label><input [(ngModel)]="editData.department" /></div>
                <div class="field"><label>Location</label><input [(ngModel)]="editData.location" /></div>
                <div class="field">
                  <label>Availability</label>
                  <select [(ngModel)]="editData.availability">
                    <option value="">Not set</option>
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div class="field"><label>LinkedIn URL</label><input [(ngModel)]="editData.linkedInUrl" /></div>
              </div>
              <div class="form-actions">
                <button class="btn-save" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save Changes' }}</button>
                @if (saveMsg()) { <span class="save-msg" [class.error]="saveError()">{{ saveMsg() }}</span> }
              </div>
            </div>
          }

          @if (profile()!.summary) {
            <div class="section">
              <h3>AI Summary</h3>
              <p class="summary-text">{{ profile()!.summary }}</p>
            </div>
          }

          <!-- SKILLS with inline editing -->
          <div class="section">
            <div class="section-header">
              <h3>Skills ({{ editingSkills() ? draftSkills().length : profile()!.skills.length }})</h3>
              @if (!editingSkills()) {
                <button class="btn-section-edit" (click)="startEditSkills()">✏️ Edit Skills</button>
              } @else {
                <div class="skill-edit-actions">
                  <button class="btn-save-skills" (click)="saveSkills()" [disabled]="skillSaving()">{{ skillSaving() ? 'Saving...' : 'Save' }}</button>
                  <button class="btn-cancel-skills" (click)="cancelEditSkills()">Cancel</button>
                </div>
              }
            </div>

            @if (!editingSkills()) {
              <div class="skills-grid">
                @for (s of profile()!.skills; track s.id) {
                  <div class="skill-item">
                    <span class="skill-name">{{ s.name }}</span>
                    @if (s.category) { <span class="cat">{{ s.category }}</span> }
                    <div class="prof-dots">
                      @for (i of [1,2,3,4,5]; track i) {
                        <span class="dot" [class.filled]="i <= s.proficiencyLevel"></span>
                      }
                    </div>
                    <span class="prof-label" [class]="profClass(s.proficiencyLevel)">{{ profLabel(s.proficiencyLevel) }}</span>
                    @if (s.yearsExperience) { <span class="yrs">{{ s.yearsExperience }}y</span> }
                    @if (s.yearsExperience == null) { <span class="ai-badge" title="AI inferred skill">AI</span> }
                  </div>
                }
              </div>
            } @else {
              <div class="skill-edit-list">
                @for (s of draftSkills(); track $index; let i = $index) {
                  <div class="skill-edit-row">
                    <button class="skill-remove" (click)="removeSkill(i)">✕</button>
                    <span class="skill-edit-name">{{ s.name }}</span>
                    @if (s.category) { <span class="cat">{{ s.category }}</span> }
                    <div class="prof-edit-dots">
                      @for (lvl of [1,2,3,4,5]; track lvl) {
                        <button class="dot-btn" [class.filled]="lvl <= s.proficiency"
                                (click)="setSkillProf(i, lvl)" [title]="profLabel(lvl)"></button>
                      }
                    </div>
                    <span class="prof-label sm" [class]="profClass(s.proficiency)">{{ profLabel(s.proficiency) }}</span>
                  </div>
                }
              </div>
              <div class="add-skill-row">
                <input class="add-skill-input" [(ngModel)]="newSkill.name" placeholder="Skill name" />
                <select class="add-skill-cat" [(ngModel)]="newSkill.category">
                  <option value="">Category</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Database">Database</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Mobile">Mobile</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Other">Other</option>
                </select>
                <div class="add-skill-prof">
                  @for (lvl of [1,2,3,4,5]; track lvl) {
                    <button class="dot-btn" [class.filled]="lvl <= newSkill.proficiency"
                            (click)="newSkill.proficiency = lvl" [title]="profLabel(lvl)"></button>
                  }
                </div>
                <button class="btn-add-skill" (click)="addNewSkill()" [disabled]="!newSkill.name.trim()">+ Add</button>
              </div>
              @if (skillSaveMsg()) { <div class="skill-save-msg">{{ skillSaveMsg() }}</div> }
            }
          </div>

          @if (profile()!.experience.length > 0) {
            <div class="section">
              <h3>Experience</h3>
              @for (exp of profile()!.experience; track exp.companyName) {
                <div class="exp-item">
                  <div class="exp-header">
                    <strong>{{ exp.jobTitle }}</strong><span class="company"> at {{ exp.companyName }}</span>
                  </div>
                  <span class="date">{{ exp.startDate | date:'MMM yyyy' }} – {{ exp.isCurrent ? 'Present' : (exp.endDate | date:'MMM yyyy') }}
                    @if (exp.isCurrent) { <span class="current-badge">Current</span> }
                  </span>
                  @if (exp.description) { <p class="exp-desc">{{ exp.description }}</p> }
                  @if (exp.techStack.length > 0) {
                    <div class="tech-tags">@for (t of exp.techStack; track t) { <span class="tech-tag">{{ t }}</span> }</div>
                  }
                </div>
              }
            </div>
          }

          @if (profile()!.projects.length > 0) {
            <div class="section">
              <h3>Projects</h3>
              @for (proj of profile()!.projects; track proj.name) {
                <div class="proj-item">
                  <div class="proj-header">
                    <strong>{{ proj.name }}</strong>
                    @if (proj.gitHubUrl) { <a [href]="proj.gitHubUrl" target="_blank" class="gh-link">GitHub ↗</a> }
                  </div>
                  @if (proj.description) { <p class="proj-desc">{{ proj.description }}</p> }
                  @if (proj.techStack.length > 0) {
                    <div class="tech-tags">@for (t of proj.techStack; track t) { <span class="tech-tag">{{ t }}</span> }</div>
                  }
                </div>
              }
            </div>
          }

          @if (profile()!.education.length > 0) {
            <div class="section">
              <h3>Education</h3>
              @for (edu of profile()!.education; track edu.institution) {
                <div class="edu-item">
                  <strong>{{ edu.institution }}</strong>
                  @if (edu.degree || edu.fieldOfStudy) {
                    <span class="edu-detail"> — {{ edu.degree }}{{ edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : '' }}</span>
                  }
                  @if (edu.graduationYear) { <span class="date">Class of {{ edu.graduationYear }}</span> }
                </div>
              }
            </div>
          }

          @if (profile()!.certifications && profile()!.certifications.length > 0) {
            <div class="section">
              <h3>Certifications ({{ profile()!.certifications.length }})</h3>
              @for (cert of profile()!.certifications; track cert.name) {
                <div class="cert-item">
                  <div class="cert-header">
                    <strong>{{ cert.name }}</strong>
                    @if (cert.credentialUrl) { <a [href]="cert.credentialUrl" target="_blank" class="cert-link">Verify ↗</a> }
                  </div>
                  @if (cert.issuingOrganization) { <span class="cert-org">{{ cert.issuingOrganization }}</span> }
                  @if (cert.issueDate || cert.expiryDate) { <span class="cert-date">{{ cert.issueDate }}{{ cert.expiryDate ? ' – ' + cert.expiryDate : '' }}</span> }
                  @if (cert.credentialId) { <span class="cert-id">Credential ID: {{ cert.credentialId }}</span> }
                </div>
              }
            </div>
          }

          @if (profile()!.status === 'Pending') {
            <div class="bottom-actions">
              <button class="btn-approve-big" (click)="approve()">✓ Approve Profile</button>
              <button class="btn-reject-big" (click)="reject()">✕ Reject</button>
            </div>
          }
        </div>
      }
      @if (!loading() && !profile()) { <div class="empty">Profile not found.</div> }
    </div>
  `,
  styles: [`
    .page { max-width:760px; margin:2rem auto; padding:0 1rem; }
    .back-link { display:inline-block; color:#4f46e5; text-decoration:none; font-size:.9rem; margin-bottom:1.25rem; }
    .back-link:hover { text-decoration:underline; }
    .loading, .empty { text-align:center; color:#666; padding:3rem; }

    .review-banner { display:flex; align-items:flex-start; gap:.875rem; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:1rem 1.25rem; margin-bottom:1.25rem; }
    .review-icon { font-size:1.1rem; color:#d97706; margin-top:.05rem; flex-shrink:0; }
    .review-text { flex:1; }
    .review-text strong { display:block; font-size:.9rem; font-weight:600; color:#92400e; margin-bottom:.2rem; }
    .review-text span { font-size:.82rem; color:#78350f; line-height:1.5; }
    .review-actions { display:flex; gap:.5rem; flex-shrink:0; align-self:center; }
    .btn-approve-top { padding:.4rem .9rem; background:#059669; color:white; border:none; border-radius:7px; font-size:.82rem; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-approve-top:hover { background:#047857; }
    .btn-reject-top { padding:.4rem .9rem; background:white; color:#dc2626; border:1px solid #fca5a5; border-radius:7px; font-size:.82rem; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-reject-top:hover { background:#fef2f2; }

    .profile-card { background:white; border-radius:12px; padding:2rem; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .profile-header { display:flex; gap:1.25rem; align-items:flex-start; margin-bottom:1.75rem; }
    .avatar { width:64px; height:64px; background:#4f46e5; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:700; flex-shrink:0; }
    .header-info { flex:1; }
    .header-info h2 { margin:0 0 .25rem; font-size:1.4rem; color:#1a1a2e; }
    .title { margin:0 0 .5rem; color:#6b7280; font-size:.95rem; }
    .meta-row { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .years, .location { font-size:.83rem; color:#6b7280; }
    .avail-badge { padding:.2rem .6rem; border-radius:9999px; font-size:.72rem; font-weight:600; }
    .avail-badge.available { background:#dcfce7; color:#166534; }
    .avail-badge.busy { background:#fee2e2; color:#dc2626; }
    .avail-badge.on-leave { background:#fef9c3; color:#92400e; }
    .linkedin { font-size:.82rem; color:#4f46e5; text-decoration:none; }
    .status-badge { padding:.2rem .7rem; border-radius:9999px; font-size:.75rem; font-weight:600; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.pending { background:#fef9c3; color:#92400e; }
    .status-badge.rejected { background:#fee2e2; color:#dc2626; }
    .btn-edit { padding:.4rem .9rem; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; font-size:.83rem; cursor:pointer; color:#4f46e5; font-weight:600; flex-shrink:0; white-space:nowrap; }
    .btn-edit:hover { background:#e0e7ff; }

    h3 { font-size:1rem; color:#374151; margin:0 0 .75rem; border-bottom:1px solid #f3f4f6; padding-bottom:.4rem; }
    .section { margin-bottom:1.75rem; }
    .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; border-bottom:1px solid #f3f4f6; padding-bottom:.4rem; }
    .section-header h3 { margin:0; border:none; padding:0; }
    .btn-section-edit { padding:.3rem .7rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:.78rem; cursor:pointer; color:#4f46e5; font-weight:600; }
    .btn-section-edit:hover { background:#ede9fe; border-color:#a5b4fc; }
    .skill-edit-actions { display:flex; gap:.4rem; }
    .btn-save-skills { padding:.3rem .75rem; background:#4f46e5; color:white; border:none; border-radius:6px; font-size:.78rem; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-save-skills:disabled { opacity:.6; cursor:not-allowed; }
    .btn-cancel-skills { padding:.3rem .7rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:.78rem; cursor:pointer; color:#64748b; font-weight:500; font-family:inherit; }
    .skill-save-msg { font-size:.8rem; color:#059669; margin-top:.5rem; font-weight:500; }

    .summary-text { color:#4b5563; line-height:1.6; font-size:.95rem; }
    .edit-panel { background:#f8fafc; border:1.5px solid #e0e7ff; border-radius:10px; padding:1.25rem; margin-bottom:1.75rem; }
    .edit-panel h3 { color:#4f46e5; border-color:#e0e7ff; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; margin-bottom:1rem; }
    .field { display:flex; flex-direction:column; gap:.3rem; }
    .field label { font-size:.8rem; font-weight:600; color:#374151; }
    .field input, .field select { padding:.5rem .75rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size:.88rem; font-family:inherit; }
    .field input:focus, .field select:focus { outline:none; border-color:#4f46e5; }
    .form-actions { display:flex; align-items:center; gap:1rem; }
    .btn-save { padding:.5rem 1.25rem; background:#4f46e5; color:white; border:none; border-radius:8px; font-size:.88rem; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }
    .save-msg { font-size:.85rem; color:#059669; font-weight:500; }
    .save-msg.error { color:#dc2626; }

    .skills-grid { display:flex; flex-wrap:wrap; gap:.5rem; }
    .skill-item { display:flex; align-items:center; gap:.4rem; background:#f8fafc; padding:.4rem .8rem; border-radius:8px; font-size:.82rem; flex-wrap:wrap; }
    .skill-name { font-weight:500; color:#1a1a2e; }
    .cat { color:#9ca3af; font-size:.72rem; background:#e5e7eb; padding:.1rem .35rem; border-radius:4px; }
    .prof-dots { display:flex; gap:2px; }
    .dot { width:7px; height:7px; border-radius:50%; background:#e5e7eb; }
    .dot.filled { background:#4f46e5; }
    .prof-label { font-size:.7rem; font-weight:600; padding:.1rem .35rem; border-radius:4px; }
    .prof-label.sm { font-size:.7rem; }
    .prof-label.beginner { background:#fef9c3; color:#92400e; }
    .prof-label.basic { background:#fef3c7; color:#d97706; }
    .prof-label.intermediate { background:#dbeafe; color:#1e40af; }
    .prof-label.advanced { background:#dcfce7; color:#166534; }
    .prof-label.expert { background:#ede9fe; color:#6d28d9; }
    .yrs { color:#9ca3af; font-size:.72rem; }
    .ai-badge { font-size:.65rem; font-weight:700; color:#7c3aed; background:#ede9fe; padding:.1rem .35rem; border-radius:4px; letter-spacing:.03em; }

    .skill-edit-list { display:flex; flex-direction:column; gap:.35rem; margin-bottom:.75rem; }
    .skill-edit-row { display:flex; align-items:center; gap:.5rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:.4rem .75rem; flex-wrap:wrap; }
    .skill-remove { width:20px; height:20px; background:#fee2e2; border:none; border-radius:4px; cursor:pointer; color:#dc2626; font-size:.7rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .skill-edit-name { font-weight:600; font-size:.875rem; color:#0f172a; flex:1; min-width:80px; }
    .prof-edit-dots { display:flex; gap:3px; }
    .dot-btn { width:12px; height:12px; border-radius:50%; background:#e2e8f0; border:none; cursor:pointer; transition:.1s; }
    .dot-btn.filled { background:#4f46e5; }
    .dot-btn:hover { background:#a5b4fc; }
    .add-skill-row { display:flex; align-items:center; gap:.5rem; padding:.6rem .75rem; background:#fafaf9; border:1.5px dashed #e2e8f0; border-radius:8px; flex-wrap:wrap; }
    .add-skill-input { flex:1; min-width:120px; padding:.4rem .65rem; border:1.5px solid #e2e8f0; border-radius:6px; font-size:.85rem; font-family:inherit; }
    .add-skill-input:focus { outline:none; border-color:#4f46e5; }
    .add-skill-cat { padding:.4rem .5rem; border:1.5px solid #e2e8f0; border-radius:6px; font-size:.82rem; font-family:inherit; }
    .add-skill-cat:focus { outline:none; border-color:#4f46e5; }
    .add-skill-prof { display:flex; gap:3px; }
    .btn-add-skill { padding:.35rem .8rem; background:#4f46e5; color:white; border:none; border-radius:6px; font-size:.82rem; font-weight:600; cursor:pointer; white-space:nowrap; font-family:inherit; }
    .btn-add-skill:disabled { opacity:.5; cursor:not-allowed; }

    .exp-item, .proj-item, .edu-item { margin-bottom:1rem; font-size:.9rem; color:#374151; padding-bottom:.75rem; border-bottom:1px solid #f9fafb; }
    .exp-header, .proj-header { display:flex; align-items:center; gap:.25rem; flex-wrap:wrap; }
    .company { color:#6b7280; }
    .date { display:block; font-size:.8rem; color:#9ca3af; margin:.25rem 0; }
    .current-badge { background:#dcfce7; color:#166534; padding:.1rem .4rem; border-radius:4px; font-size:.72rem; font-weight:600; margin-left:.3rem; }
    .exp-desc, .proj-desc { margin:.35rem 0 .5rem; font-size:.85rem; color:#6b7280; line-height:1.5; }
    .tech-tags { display:flex; flex-wrap:wrap; gap:.3rem; margin-top:.4rem; }
    .tech-tag { padding:.15rem .5rem; background:#ede9fe; color:#6d28d9; border-radius:4px; font-size:.75rem; }
    .gh-link { font-size:.8rem; color:#4f46e5; text-decoration:none; margin-left:.5rem; }
    .edu-detail { font-weight:400; color:#6b7280; }
    .cert-item { margin-bottom:1rem; font-size:.9rem; color:#374151; padding-bottom:.75rem; border-bottom:1px solid #f9fafb; }
    .cert-header { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
    .cert-org { display:block; font-size:.83rem; color:#6b7280; margin-top:.15rem; }
    .cert-date { display:block; font-size:.8rem; color:#9ca3af; margin-top:.1rem; }
    .cert-id { display:block; font-size:.75rem; color:#9ca3af; }
    .cert-link { font-size:.8rem; color:#4f46e5; text-decoration:none; margin-left:.25rem; }

    .bottom-actions { display:flex; gap:.75rem; padding-top:1.25rem; border-top:1px solid #f3f4f6; margin-top:.5rem; }
    .btn-approve-big { flex:1; padding:.7rem; background:#059669; color:white; border:none; border-radius:8px; font-size:.9rem; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-approve-big:hover { background:#047857; }
    .btn-reject-big { flex:1; padding:.7rem; background:white; color:#dc2626; border:1.5px solid #fca5a5; border-radius:8px; font-size:.9rem; font-weight:600; cursor:pointer; font-family:inherit; }
    .btn-reject-big:hover { background:#fef2f2; }
  `]
})
export class ProfileViewComponent implements OnInit {
  profile = signal<ProfileResponse | null>(null);
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  saveMsg = signal('');
  saveError = signal(false);
  profileId = '';
  editData = { fullName: '', currentTitle: '', department: '', location: '', availability: '', linkedInUrl: '' };

  editingSkills = signal(false);
  draftSkills = signal<SkillRow[]>([]);
  newSkill = { name: '', category: '', proficiency: 3 };
  skillSaving = signal(false);
  skillSaveMsg = signal('');

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.profileId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.profileId) { this.loading.set(false); return; }
    this.loadProfile();
  }

  loadProfile() {
    this.http.get<ApiResponse<ProfileResponse>>(`${environment.apiUrl}/profiles/${this.profileId}`).subscribe({
      next: res => { if (res.success) this.profile.set(res.data!); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggleEdit() {
    const p = this.profile();
    if (!this.editing() && p) {
      this.editData = { fullName: p.fullName, currentTitle: p.currentTitle ?? '', department: p.department ?? '', location: p.location ?? '', availability: p.availability ?? '', linkedInUrl: p.linkedInUrl ?? '' };
    }
    this.editing.update(v => !v);
    this.saveMsg.set('');
  }

  save() {
    this.saving.set(true);
    this.http.patch<ApiResponse<ProfileResponse>>(`${environment.apiUrl}/hr/profiles/${this.profileId}`, this.editData).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.profile.set(res.data); this.editing.set(false);
          this.saveError.set(false); this.saveMsg.set('Saved');
          setTimeout(() => this.saveMsg.set(''), 2500);
        }
      },
      error: () => { this.saving.set(false); this.saveError.set(true); this.saveMsg.set('Save failed'); }
    });
  }

  approve() {
    this.http.patch(`${environment.apiUrl}/hr/profiles/${this.profileId}/approve`, {}).subscribe({
      next: () => this.loadProfile()
    });
  }

  reject() {
    this.http.patch(`${environment.apiUrl}/hr/profiles/${this.profileId}/reject`, { reason: 'Rejected by HR' }).subscribe({
      next: () => this.loadProfile()
    });
  }

  startEditSkills() {
    const p = this.profile();
    if (!p) return;
    this.draftSkills.set(p.skills.map(s => ({ name: s.name, category: s.category ?? '', proficiency: s.proficiencyLevel, years: s.yearsExperience ?? null })));
    this.newSkill = { name: '', category: '', proficiency: 3 };
    this.skillSaveMsg.set('');
    this.editingSkills.set(true);
  }

  cancelEditSkills() { this.editingSkills.set(false); this.skillSaveMsg.set(''); }

  removeSkill(i: number) {
    this.draftSkills.update(list => list.filter((_, idx) => idx !== i));
  }

  setSkillProf(i: number, level: number) {
    this.draftSkills.update(list => list.map((s, idx) => idx === i ? { ...s, proficiency: level } : s));
  }

  addNewSkill() {
    const name = this.newSkill.name.trim();
    if (!name) return;
    if (this.draftSkills().some(s => s.name.toLowerCase() === name.toLowerCase())) {
      this.skillSaveMsg.set('Skill already in list.'); setTimeout(() => this.skillSaveMsg.set(''), 2000); return;
    }
    this.draftSkills.update(list => [...list, { name, category: this.newSkill.category, proficiency: this.newSkill.proficiency, years: null }]);
    this.newSkill = { name: '', category: '', proficiency: 3 };
  }

  saveSkills() {
    // Auto-add any skill typed in the input field but not yet added
    if (this.newSkill.name.trim()) { this.addNewSkill(); }
    this.skillSaving.set(true);
    const payload = { skills: this.draftSkills().map(s => ({ name: s.name, category: s.category || null, proficiency: s.proficiency, years: s.years })) };
    this.http.patch<ApiResponse<ProfileResponse>>(`${environment.apiUrl}/hr/profiles/${this.profileId}/skills`, payload).subscribe({
      next: res => {
        this.skillSaving.set(false);
        if (res.success && res.data) {
          this.profile.set(res.data); this.editingSkills.set(false);
          this.skillSaveMsg.set('Skills saved!'); setTimeout(() => this.skillSaveMsg.set(''), 2500);
        } else {
          this.skillSaveMsg.set('Save failed. Try again.');
        }
      },
      error: () => { this.skillSaving.set(false); this.skillSaveMsg.set('Failed to save skills.'); }
    });
  }

  profLabel(level: number): string {
    return ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][level] ?? 'Unknown';
  }
  profClass(level: number): string {
    return ['', 'beginner', 'basic', 'intermediate', 'advanced', 'expert'][level] ?? '';
  }
}
