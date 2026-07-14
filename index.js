/* ==========================================================================
   Unified Media Studio — Stable Releases Web Interface Logic
   Simulated application client behaviors, tabs, logs, and progress
   ========================================================================== */

let selectedFileName = "";
let isProcessing = false;

// ── File Selection ────────────────────────────────────────────────────────────
function selectFile(element, filename) {
  if (isProcessing) return;
  
  // Clear previous selected
  document.querySelectorAll('.tree-item.file').forEach(el => {
    el.classList.remove('selected');
  });

  // Select new
  element.classList.add('selected');
  selectedFileName = filename;

  // Update active queue box
  const queueList = document.getElementById('active-queue-list');
  queueList.innerHTML = `
    <li>✓ Staged: <b>${filename}</b></li>
    <li class="empty-state-text" style="color: var(--accent-blue) !important; font-style: normal; margin-top: 6px;">
      ℹ Ready. Choose a tool tab and run!
    </li>
  `;

  // Log in console
  logToConsole(`[SYSTEM] Loaded workspace file: "${filename}" into buffer.`, 'system');
}

function toggleFolder(element) {
  const children = element.nextElementSibling;
  children.classList.toggle('show');
  const arrow = element.querySelector('.arrow');
  if (children.classList.contains('show')) {
    arrow.textContent = '▼';
  } else {
    arrow.textContent = '►';
  }
}

// ── Pipeline Step Toggle ───────────────────────────────────────────────────────
function updatePipelineStepState(stepId, isEnabled) {
  const step = document.getElementById(stepId);
  if (!step) return;
  if (isEnabled) {
    step.classList.remove('pipeline-step-disabled');
  } else {
    step.classList.add('pipeline-step-disabled');
  }
  updatePipelineCount();
}

function updatePipelineCount() {
  const ids = ['pipe-silence', 'pipe-transcribe', 'pipe-enhance', 'pipe-convert'];
  const active = ids.filter(id => {
    const el = document.getElementById(id);
    return el && el.checked;
  }).length;
  const label = document.getElementById('pipeline-active-count');
  if (label) label.textContent = `${active} of ${ids.length} steps active`;
}

// ── Tab Switching ─────────────────────────────────────────────────────────────
function switchTab(btnElement, tabId) {
  if (isProcessing) return;

  // Toggle active tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  btnElement.classList.add('active');

  // Toggle active content divs
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');

  logToConsole(`[SYSTEM] Switched panel: ${btnElement.textContent.trim()}`, 'system');
}

// ── Log and Console Helpers ───────────────────────────────────────────────────
function logToConsole(text, type = 'out') {
  const logContainer = document.getElementById('console-log-lines');
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.textContent = text;
  logContainer.appendChild(line);
  
  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function clearConsole() {
  document.getElementById('console-log-lines').innerHTML = '';
}

// ── Task Simulator ────────────────────────────────────────────────────────────
function runSimulatedTask(taskType) {
  if (isProcessing) return;
  
  if (!selectedFileName) {
    alert("Please select a media file from the File Browser sidebar first!");
    logToConsole("[ERROR] Task execution halted: No input file selected in browser.", 'err');
    return;
  }

  isProcessing = true;
  document.getElementById('task-status').textContent = "Task Executing...";
  document.getElementById('task-status').style.color = "var(--accent-purple-hover)";
  clearConsole();

  let progress = 0;
  const progressBar = document.getElementById('sim-progress-bar');
  progressBar.style.width = '0%';

  logToConsole(`[SYSTEM] Initiating task sequence: "${taskType.toUpperCase()}"`, 'system');
  logToConsole(`[CMD] Input target: /workspace_media/${selectedFileName}`, 'cmd');

  const logs = getLogsForTask(taskType, selectedFileName);
  let logIndex = 0;

  // Interval timer for log printing and progress bar updates
  const interval = setInterval(() => {
    if (logIndex < logs.length) {
      const log = logs[logIndex];
      logToConsole(log.text, log.type);
      
      progress = Math.min(100, Math.floor((logIndex + 1) * (100 / logs.length)));
      progressBar.style.width = `${progress}%`;
      
      logIndex++;
    } else {
      clearInterval(interval);
      isProcessing = false;
      progressBar.style.width = '100%';
      document.getElementById('task-status').textContent = "Task Complete";
      document.getElementById('task-status').style.color = "var(--accent-green)";
      logToConsole("[SUCCESS] Task execution finished successfully. Output generated.", 'out');
      
      // Update sidebar queue
      const baseName = selectedFileName.substring(0, selectedFileName.lastIndexOf('.')) || selectedFileName;
      const outExt = getOutputExtensionForTask(taskType);
      const outName = `${baseName}_processed${outExt}`;
      
      // Add simulated output to sidebar children list
      const treeChildren = document.querySelector('.tree-children');
      const newFileItem = document.createElement('div');
      newFileItem.className = 'tree-item file';
      newFileItem.style.color = 'var(--accent-green)';
      newFileItem.style.fontWeight = 'bold';
      newFileItem.textContent = `✓ ${outName}`;
      newFileItem.onclick = function() { selectFile(this, outName); };
      treeChildren.appendChild(newFileItem);
      
      logToConsole(`[SYSTEM] Output file deployed: "${outName}"`, 'system');
    }
  }, 700);
}

function getOutputExtensionForTask(taskType) {
  if (taskType === 'pipeline') return '_pipeline.mp4';
  if (taskType === 'silence') {
    const mode = document.getElementById('silence-mode').value;
    return mode === 'xml' ? '.xml' : '_cut.mp4';
  }
  if (taskType === 'transcribe') return '.srt';
  if (taskType === 'convert') {
    const preset = document.getElementById('convert-preset').value;
    if (preset === 'dnxhd') return '.mov';
    if (preset === 'wav_pcm') return '.wav';
    if (preset === 'mp3_320') return '.mp3';
    return '.mp4';
  }
  return '_enhanced.wav';
}

function getLogsForTask(taskType, filename) {
  const commonHeader = [
    { text: "[SYSTEM] Initializing backend processes...", type: 'system' },
    { text: "[SYSTEM] Checking hardware capabilities...", type: 'system' },
    { text: "  -> Found CUDA-compatible GPU: NVIDIA RTX 4070 Laptop GPU", type: 'out' },
    { text: "  -> Found CPU hardware threads: 16 logically mapped", type: 'out' }
  ];

  if (taskType === 'silence') {
    const mode = document.getElementById('silence-mode').value;
    const thresh = document.getElementById('silence-thresh').value;
    return [
      ...commonHeader,
      { text: `[CMD] auto-editor "${filename}" --margin 0.2s --threshold ${thresh}dB --export ${mode}`, type: 'cmd' },
      { text: "Extracting audio track from media file...", type: 'out' },
      { text: "Analyzing decibel envelopes across timeline...", type: 'out' },
      { text: "  -> Processed 14,200 audio packets.", type: 'out' },
      { text: "  -> Detected 8 silent segments (total 14.5 seconds cut).", type: 'out' },
      { text: "Generating new non-destructive edit timeline structure...", type: 'out' },
      { text: "Writing trimmed media streams via FFmpeg codecs...", type: 'out' },
      { text: "FFmpeg: [h264_nvenc] Successfully encoded trimmed video stream.", type: 'out' },
      { text: "FFmpeg: [aac] Successfully multiplexed stereo audio stream.", type: 'out' }
    ];
  }

  if (taskType === 'transcribe') {
    const model = document.getElementById('whisper-model').value;
    const summary = document.getElementById('transcribe-chapters').checked;
    const list = [
      ...commonHeader,
      { text: `[CMD] whisper "${filename}" --model ${model} --device cuda --output_format srt`, type: 'cmd' },
      { text: `Loading Whisper local weights (${model} model)...`, type: 'out' },
      { text: "Extracting audio features (Mel spectrogram conversion)...", type: 'out' },
      { text: "Whisper-inference: [00:00.00 -> 00:04.50] 'Welcome to the podcast, today we discuss local AI.'", type: 'out' },
      { text: "Whisper-inference: [00:04.50 -> 00:08.20] 'Fully offline desktop execution is safer.'", type: 'out' },
      { text: "Writing SubRip Subtitle file (.srt)...", type: 'out' }
    ];
    if (summary) {
      list.push(
        { text: "[Ollama] Querying local llama3 engine for chapter summaries...", type: 'system' },
        { text: "[Ollama] Connection active. Summarizing key topics...", type: 'out' },
        { text: "  -> Summary: Introduction to offline AI architecture.", type: 'out' }
      );
    }
    return list;
  }

  if (taskType === 'convert') {
    const preset = document.getElementById('convert-preset').value;
    return [
      ...commonHeader,
      { text: `[CMD] ffmpeg -i "${filename}" -preset slow -c:v copy -c:a aac /workspace_media/${preset}_out`, type: 'cmd' },
      { text: "FFmpeg library initialized.", type: 'out' },
      { text: `Mapping output profile: ${preset.toUpperCase()}`, type: 'system' },
      { text: "Transcoding frames...", type: 'out' },
      { text: "  -> frame=  342 fps= 48 q=-1.0 Lsize=   1204kB", type: 'out' },
      { text: "  -> frame=  712 fps= 51 q=-1.0 Lsize=   2456kB", type: 'out' },
      { text: "Muxing stream files into final container...", type: 'out' }
    ];
  }

  if (taskType === 'enhance') {
    const preset = document.getElementById('enhance-preset').value;
    return [
      ...commonHeader,
      { text: `[CMD] ffmpeg -i "${filename}" -af lowpass=f=3000,highpass=f=200 -c:a pcm_s16le`, type: 'cmd' },
      { text: "FFmpeg audio filters instantiated.", type: 'out' },
      { text: `Applying Mastering profile: ${preset.toUpperCase()}`, type: 'system' },
      { text: "Calculating audio gate/threshold ranges...", type: 'out' },
      { text: "Applying noise-reduction filter coefficient matrices...", type: 'out' },
      { text: "Writing uncompressed mastered WAV stream...", type: 'out' }
    ];
  }

  if (taskType === 'pipeline') {
    const runSilence = document.getElementById('pipe-silence').checked;
    const runTranscribe = document.getElementById('pipe-transcribe').checked;
    const runEnhance = document.getElementById('pipe-enhance').checked;
    const runConvert = document.getElementById('pipe-convert').checked;

    const list = [...commonHeader];
    
    if (runSilence) {
      list.push(
        { text: "[PIPELINE] STEP 1: Executing Silence Auto-Trim...", type: 'system' },
        { text: `[CMD] auto-editor "${filename}" --threshold -35dB --margin 0.2s`, type: 'cmd' },
        { text: "  -> Analyzing decibels... Trimmed 11 silent sections.", type: 'out' }
      );
    }
    if (runTranscribe) {
      list.push(
        { text: "[PIPELINE] STEP 2: Executing OpenAI Whisper Transcription...", type: 'system' },
        { text: `[CMD] whisper "${filename}" --model base --device cuda`, type: 'cmd' },
        { text: "  -> Transcribed audio. Writing subtitles (.srt)...", type: 'out' }
      );
    }
    if (runEnhance) {
      list.push(
        { text: "[PIPELINE] STEP 3: Executing Voice Clarity Mastering...", type: 'system' },
        { text: `[CMD] ffmpeg -i "${filename}" -af lowpass=f=3000,highpass=f=200`, type: 'cmd' },
        { text: "  -> High-pass and Low-pass filters successfully compiled.", type: 'out' }
      );
    }
    if (runConvert) {
      list.push(
        { text: "[PIPELINE] STEP 4: Executing Final Container Transcode...", type: 'system' },
        { text: `[CMD] ffmpeg -i "${filename}" -c:v h264_nvenc -c:a aac /workspace_media/output_pipeline`, type: 'cmd' },
        { text: "  -> Multi-stream multiplexing complete.", type: 'out' }
      );
    }
    
    return list;
  }

  return [];
}

// ── Accordion Toggle ──────────────────────────────────────────────────────────
function toggleAccordion(titleElement) {
  const item = titleElement.parentElement;
  item.classList.toggle('open');
}

// ── Submit GitHub Issue Form ──────────────────────────────────────────────────
function submitGitHubIssue(event) {
  event.preventDefault();

  const categoryElement = document.getElementById('issue-type');
  const titleElement = document.getElementById('issue-title');
  const systemElement = document.getElementById('issue-system');
  const bodyElement = document.getElementById('issue-body');

  const category = categoryElement.options[categoryElement.selectedIndex].text;
  const title = titleElement.value.trim();
  const system = systemElement.value;
  const bodyText = bodyElement.value.trim();

  // Create GitHub New Issue URL template
  const repoUrl = "https://github.com/tarzo-codes/unified-media-studio-releases/issues/new";
  
  // Format body markdown content
  const issueBody = `### Environment
* **OS / System:** ${system}
* **Release Version:** v1.1.6-alpha

### Details / Feedback
${bodyText}

---
*Submitted via the Unified Media Studio portal web form.*`;

  // Encode parameters
  const finalTitle = encodeURIComponent(`[${category}] ${title}`);
  const finalBody = encodeURIComponent(issueBody);

  const gitHubUrl = `${repoUrl}?title=${finalTitle}&body=${finalBody}`;

  // Open in a new tab
  window.open(gitHubUrl, '_blank');

  // Reset form
  document.getElementById('issue-form').reset();
  
  logToConsole(`[SYSTEM] Issue template generated. Redirecting to GitHub Issues...`, 'system');
}

// ── Mobile Menu Toggles ───────────────────────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('nav-links-menu');
  menu.classList.toggle('active');
}

function closeMobileMenu() {
  const menu = document.getElementById('nav-links-menu');
  menu.classList.remove('active');
}

