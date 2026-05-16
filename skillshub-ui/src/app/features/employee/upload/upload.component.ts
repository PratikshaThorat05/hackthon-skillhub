import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/models';

type Step = 'idle' | 'uploading' | 'queued' | 'processing' | 'done' | 'failed';
type Tab = 'file' | 'linkedin' | 'github';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1>Upload Resume</h1>
        <p>AI will extract your skills, experience, certifications, and education automatically.</p>
      </div>

      @if (step() === 'idle' || step() === 'uploading') {
        <div class="upload-card">
          <div class="tabs">
            <button class="tab" [class.active]="activeTab === 'file'" (click)="activeTab = 'file'">
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>
              Resume File
            </button>
            <button class="tab" [class.active]="activeTab === 'github'" (click)="activeTab = 'github'">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub Profile
            </button>
            <button class="tab" [class.active]="activeTab === 'linkedin'" (click)="activeTab = 'linkedin'">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn Profile
            </button>
          </div>

          @if (activeTab === 'file') {
            <div class="drop-zone" [class.has-file]="!!selectedFile" [class.dragging]="dragging"
                 (click)="fileInput.click()"
                 (dragover)="$event.preventDefault(); dragging=true"
                 (dragleave)="dragging=false"
                 (drop)="onDrop($event)">
              @if (!selectedFile) {
                <div class="drop-content">
                  <div class="drop-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                    </svg>
                  </div>
                  <p class="drop-title">Drop your resume here</p>
                  <p class="drop-sub">or <span class="browse-link">click to browse</span></p>
                  <p class="drop-formats">Supports PDF, DOCX, TXT &middot; Max 5MB</p>
                </div>
              } @else {
                <div class="file-selected">
                  <div class="file-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z"/><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z"/></svg>
                  </div>
                  <div class="file-meta">
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ (selectedFile.size / 1024).toFixed(0) }} KB</span>
                  </div>
                  <button class="remove-btn" (click)="$event.stopPropagation(); selectedFile = null">
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                  </button>
                </div>
              }
            </div>
            <input #fileInput type="file" accept=".pdf,.docx,.txt" (change)="onFileSelect($event)" hidden />

            @if (errorMsg()) {
              <div class="alert-error">{{ errorMsg() }}</div>
            }

            <button class="btn-upload" [disabled]="!selectedFile || step() === 'uploading'" (click)="upload()">
              @if (step() === 'uploading') {
                <span class="btn-spinner"></span> Uploading...
              } @else {
                <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                Upload &amp; Analyze Resume
              }
            </button>
          }

          @if (activeTab === 'linkedin') {
            <div class="github-panel">
              <div class="github-hero">
                <div class="gh-icon-wrap" style="background:#0077b5">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <div>
                  <p class="gh-heading">Import from LinkedIn</p>
                  <p class="gh-sub">Paste your LinkedIn profile URL — AI will extract your skills, experience, and education automatically</p>
                </div>
              </div>

              <label class="field-label">LinkedIn Profile URL</label>
              <input class="gh-input" type="text" [(ngModel)]="linkedInUrl"
                     placeholder="https://www.linkedin.com/in/your-username"
                     (keyup.enter)="importLinkedIn()" />

              <div class="gh-what-list">
                <span class="gh-what-item">Work experience</span>
                <span class="gh-what-item">Skills &amp; endorsements</span>
                <span class="gh-what-item">Education history</span>
                <span class="gh-what-item">Certifications</span>
              </div>

              @if (errorMsg()) {
                <div class="alert-error">{{ errorMsg() }}</div>
              }

              <button class="btn-upload" [disabled]="!linkedInUrl.trim() || step() === 'uploading'" (click)="importLinkedIn()">
                @if (step() === 'uploading') {
                  <span class="btn-spinner"></span> Importing...
                } @else {
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Import LinkedIn Profile
                }
              </button>
            </div>
          }

          @if (activeTab === 'github') {
            <div class="github-panel">
              <div class="github-hero">
                <div class="gh-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </div>
                <div>
                  <p class="gh-heading">Import from GitHub</p>
                  <p class="gh-sub">AI will analyze your public repos, languages, and recent commits to infer your active skills</p>
                </div>
              </div>

              <label class="field-label">GitHub Profile URL or Username</label>
              <input class="gh-input" type="text" [(ngModel)]="githubUrl"
                     placeholder="https://github.com/username  or just  username"
                     (keyup.enter)="importGitHub()" />

              <div class="gh-what-list">
                <span class="gh-what-item">Public repositories</span>
                <span class="gh-what-item">Programming languages</span>
                <span class="gh-what-item">Recent commit history</span>
                <span class="gh-what-item">Project topics &amp; tech stack</span>
              </div>

              @if (errorMsg()) {
                <div class="alert-error">{{ errorMsg() }}</div>
              }

              <button class="btn-upload" [disabled]="!githubUrl.trim() || step() === 'uploading'" (click)="importGitHub()">
                @if (step() === 'uploading') {
                  <span class="btn-spinner"></span> Importing...
                } @else {
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  Import GitHub Profile
                }
              </button>
            </div>
          }
        </div>
      }

      @if (step() !== 'idle') {
        <div class="progress-card">
          <div class="progress-title">
            @if (step() === 'done') { Profile analyzed successfully }
            @else if (step() === 'failed') { Processing failed }
            @else { Analyzing your profile... }
          </div>

          <div class="steps">
            <div class="step" [class]="getStepClass(1)">
              <div class="step-circle">
                @if (stepNum() > 1) { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 1) { <span class="step-spinner"></span> }
                @else { 1 }
              </div>
              <div class="step-info">
                <span class="step-name">{{ activeTab === 'github' ? 'Fetching' : activeTab === 'linkedin' ? 'Connecting' : 'Upload' }}</span>
                <span class="step-desc">{{ activeTab === 'github' ? 'Calling GitHub API' : activeTab === 'linkedin' ? 'Accessing LinkedIn profile' : 'Sending file to server' }}</span>
              </div>
            </div>

            <div class="step-connector" [class.done]="stepNum() > 1"></div>

            <div class="step" [class]="getStepClass(2)">
              <div class="step-circle">
                @if (stepNum() > 2) { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 2) { <span class="step-spinner"></span> }
                @else { 2 }
              </div>
              <div class="step-info">
                <span class="step-name">{{ activeTab === 'github' ? 'Repo Analysis' : activeTab === 'linkedin' ? 'Profile Parsing' : 'Text Extraction' }}</span>
                <span class="step-desc">{{ activeTab === 'github' ? 'Reading commits &amp; languages' : activeTab === 'linkedin' ? 'Extracting profile data' : 'Reading resume content' }}</span>
              </div>
            </div>

            <div class="step-connector" [class.done]="stepNum() > 2"></div>

            <div class="step" [class]="getStepClass(3)">
              <div class="step-circle">
                @if (stepNum() > 3) { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 3) { <span class="step-spinner"></span> }
                @else { 3 }
              </div>
              <div class="step-info">
                <span class="step-name">AI Analysis</span>
                <span class="step-desc">Extracting skills &amp; experience</span>
              </div>
            </div>

            <div class="step-connector" [class.done]="stepNum() > 3"></div>

            <div class="step" [class]="getStepClass(4)">
              <div class="step-circle">
                @if (step() === 'done') { <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> }
                @else if (stepNum() === 4) { <span class="step-spinner"></span> }
                @else { 4 }
              </div>
              <div class="step-info">
                <span class="step-name">Profile Created</span>
                <span class="step-desc">Building your skill profile</span>
              </div>
            </div>
          </div>

          @if (step() === 'done') {
            <div class="done-banner">Your profile has been created. Redirecting...</div>
          }
          @if (step() === 'failed') {
            <div class="fail-banner">{{ errorMsg() || 'Processing failed. Please try again.' }}</div>
          }
        </div>
      }

      <div class="info-card">
        <h3>What gets extracted</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg></span>
            <span>Skills &amp; proficiency levels</span>
          </div>
          <div class="info-item">
            <span class="info-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/></svg></span>
            <span>Work experience history</span>
          </div>
          <div class="info-item">
            <span class="info-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg></span>
            <span>Education &amp; degrees</span>
          </div>
          <div class="info-item">
            <span class="info-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clip-rule="evenodd"/></svg></span>
            <span>Certifications &amp; credentials</span>
          </div>
          <div class="info-item">
            <span class="info-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></span>
            <span>Projects &amp; tech stack</span>
          </div>
          <div class="info-item">
            <span class="info-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg></span>
            <span>Professional summary</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { max-width: 680px; margin: 0 auto; padding: 2rem 1.5rem; }
    .page-header { margin-bottom: 1.75rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 .35rem; }
    .page-header p { color: #64748b; font-size: .9rem; margin: 0; }
    .upload-card { background: white; border-radius: 12px; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }

    .tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0; }
    .tab { display: flex; align-items: center; gap: .45rem; padding: .55rem 1rem; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: .875rem; font-weight: 500; color: #64748b; font-family: inherit; margin-bottom: -1px; transition: .15s; }
    .tab svg { width: 16px; height: 16px; }
    .tab:hover { color: #4f46e5; }
    .tab.active { color: #4f46e5; border-bottom-color: #4f46e5; }

    .drop-zone { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 2.5rem 1.5rem; text-align: center; cursor: pointer; transition: .2s; margin-bottom: 1.25rem; }
    .drop-zone:hover, .drop-zone.dragging { border-color: #4f46e5; background: #f5f3ff; }
    .drop-zone.has-file { border-style: solid; border-color: #4f46e5; background: #f5f3ff; }
    .drop-icon-wrap { width: 56px; height: 56px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto .75rem; color: #64748b; }
    .drop-icon-wrap svg { width: 28px; height: 28px; }
    .drop-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0 0 .25rem; }
    .drop-sub { font-size: .875rem; color: #64748b; margin: 0 0 .5rem; }
    .browse-link { color: #4f46e5; font-weight: 600; }
    .drop-formats { font-size: .78rem; color: #94a3b8; margin: 0; }
    .file-selected { display: flex; align-items: center; gap: 1rem; }
    .file-icon-wrap { width: 44px; height: 44px; background: #ede9fe; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #6d28d9; flex-shrink: 0; }
    .file-icon-wrap svg { width: 22px; height: 22px; }
    .file-meta { flex: 1; text-align: left; }
    .file-name { display: block; font-weight: 600; color: #0f172a; font-size: .9rem; }
    .file-size { display: block; font-size: .78rem; color: #94a3b8; margin-top: .1rem; }
    .remove-btn { width: 32px; height: 32px; background: #fee2e2; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #dc2626; flex-shrink: 0; }
    .remove-btn svg { width: 16px; height: 16px; }

    .github-panel { display: flex; flex-direction: column; gap: 1rem; }
    .github-hero { display: flex; align-items: flex-start; gap: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem 1.25rem; }
    .gh-icon-wrap { width: 40px; height: 40px; background: #0f172a; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
    .gh-icon-wrap svg { width: 22px; height: 22px; }
    .gh-heading { font-size: .925rem; font-weight: 600; color: #0f172a; margin: 0 0 .2rem; }
    .gh-sub { font-size: .8rem; color: #64748b; margin: 0; line-height: 1.5; }
    .field-label { font-size: .8rem; font-weight: 600; color: #374151; letter-spacing: .01em; }
    .gh-input { width: 100%; padding: .7rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .9rem; font-family: inherit; color: #0f172a; transition: border-color .15s; box-sizing: border-box; }
    .gh-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.08); }
    .gh-input::placeholder { color: #94a3b8; }
    .gh-what-list { display: flex; flex-wrap: wrap; gap: .4rem; }
    .gh-what-item { padding: .25rem .65rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9999px; font-size: .75rem; color: #475569; font-weight: 500; }

    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: .65rem .9rem; border-radius: 8px; font-size: .85rem; }
    .btn-upload { width: 100%; padding: .8rem; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: .95rem; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: .5rem; transition: background .15s; margin-top: .25rem; }
    .btn-upload:hover:not(:disabled) { background: #4338ca; }
    .btn-upload:disabled { opacity: .6; cursor: not-allowed; }
    .btn-upload svg { width: 18px; height: 18px; }
    .btn-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .progress-card { background: white; border-radius: 12px; padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
    .progress-title { font-size: 1rem; font-weight: 600; color: #0f172a; margin-bottom: 1.75rem; }
    .steps { display: flex; align-items: flex-start; }
    .step { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; color: #94a3b8; margin-bottom: .6rem; transition: .3s; }
    .step.active .step-circle { border-color: #4f46e5; background: #ede9fe; color: #4f46e5; }
    .step.done .step-circle { border-color: #059669; background: #059669; color: white; }
    .step.done .step-circle svg { width: 16px; height: 16px; }
    .step-spinner { width: 14px; height: 14px; border: 2px solid rgba(79,70,229,.3); border-top-color: #4f46e5; border-radius: 50%; animation: spin .7s linear infinite; }
    .step-info { text-align: center; }
    .step-name { display: block; font-size: .75rem; font-weight: 600; color: #374151; }
    .step.pending .step-name { color: #94a3b8; }
    .step-desc { display: block; font-size: .68rem; color: #94a3b8; margin-top: .15rem; line-height: 1.3; }
    .step-connector { flex: 1; height: 2px; background: #e2e8f0; margin-top: 17px; transition: .3s; }
    .step-connector.done { background: #059669; }
    .done-banner { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-top: 1.5rem; text-align: center; }
    .fail-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-top: 1.5rem; text-align: center; }
    .info-card { background: white; border-radius: 12px; padding: 1.5rem 1.75rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
    .info-card h3 { font-size: .8rem; font-weight: 700; color: #64748b; margin: 0 0 1rem; text-transform: uppercase; letter-spacing: .06em; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
    .info-item { display: flex; align-items: center; gap: .6rem; font-size: .85rem; color: #4b5563; }
    .info-icon { width: 18px; height: 18px; color: #6366f1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .info-icon svg { width: 16px; height: 16px; }
  `]
})
export class UploadComponent {
  selectedFile: File | null = null;
  dragging = false;
  githubUrl = '';
  linkedInUrl = '';
  activeTab: Tab = 'file';
  step = signal<Step>('idle');
  errorMsg = signal('');
  stepNum = computed(() => {
    switch (this.step()) {
      case 'uploading': return 1;
      case 'queued': return 2;
      case 'processing': return 3;
      case 'done': return 4;
      default: return 0;
    }
  });

  constructor(private http: HttpClient, private router: Router) {}

  getStepClass(n: number): string {
    const s = this.stepNum();
    if (s > n) return 'done';
    if (s === n) return 'active';
    return 'pending';
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) { this.selectedFile = input.files[0]; this.errorMsg.set(''); }
  }

  onDrop(event: DragEvent) {
    event.preventDefault(); this.dragging = false;
    if (event.dataTransfer?.files[0]) { this.selectedFile = event.dataTransfer.files[0]; this.errorMsg.set(''); }
  }

  upload() {
    if (!this.selectedFile) return;
    this.step.set('uploading');
    this.errorMsg.set('');
    const form = new FormData();
    form.append('file', this.selectedFile);
    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/resumes/upload`, form).subscribe({
      next: res => {
        if (res.success) {
          this.step.set('queued');
          this.pollStatus();
        } else {
          this.errorMsg.set(res.error || 'Upload failed');
          this.step.set('failed');
        }
      },
      error: () => { this.errorMsg.set('Upload failed. Please try again.'); this.step.set('failed'); }
    });
  }

  importLinkedIn() {
    const url = this.linkedInUrl.trim();
    if (!url) return;
    this.step.set('uploading');
    this.errorMsg.set('');
    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/resumes/upload-linkedin`, { linkedInUrl: url }).subscribe({
      next: res => {
        if (res.success) {
          this.step.set('queued');
          this.pollStatus();
        } else {
          this.errorMsg.set(res.error || 'LinkedIn import failed');
          this.step.set('failed');
        }
      },
      error: () => { this.errorMsg.set('LinkedIn import failed. Please try again.'); this.step.set('failed'); }
    });
  }

  importGitHub() {
    const url = this.githubUrl.trim();
    if (!url) return;
    this.step.set('uploading');
    this.errorMsg.set('');
    this.http.post<ApiResponse<any>>(`${environment.apiUrl}/resumes/upload-github`, { gitHubUrl: url }).subscribe({
      next: res => {
        if (res.success) {
          this.step.set('queued');
          this.pollStatus();
        } else {
          this.errorMsg.set(res.error || 'GitHub import failed');
          this.step.set('failed');
        }
      },
      error: () => { this.errorMsg.set('GitHub import failed. Please try again.'); this.step.set('failed'); }
    });
  }

  private pollStatus() {
    const interval = setInterval(() => {
      this.http.get<ApiResponse<any>>(`${environment.apiUrl}/resumes/status`).subscribe(res => {
        if (res.success) {
          const status = res.data?.parseStatus;
          if (status === 'Processing') this.step.set('processing');
          if (status === 'Done') {
            clearInterval(interval);
            this.step.set('done');
            setTimeout(() => this.router.navigate(['/employee/profile']), 1800);
          } else if (status === 'Failed') {
            clearInterval(interval);
            this.errorMsg.set(res.data?.parseError ?? 'Processing failed.');
            this.step.set('failed');
          }
        }
      });
    }, 3000);
    setTimeout(() => clearInterval(interval), 120000);
  }
}
