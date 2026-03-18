const socket = io();

let myName = null;
let currentState = null;
let lastKnownHighBid = null; // Track to avoid resetting bid input on timer ticks
let userEditedBid = false;   // Track if user has manually edited the bid input

// ─── DOM Elements ────────────────────────────────────────────────────────────

const screens = {
  join: document.getElementById('join-screen'),
  lobby: document.getElementById('lobby-screen'),
  kicked: document.getElementById('kicked-screen'),
  draft: document.getElementById('draft-screen'),
  results: document.getElementById('results-screen'),
};

const joinSelect = document.getElementById('name-select');
const joinBtn = document.getElementById('join-btn');
const joinError = document.getElementById('join-error');
const passwordRow = document.getElementById('password-row');
const adminPasswordInput = document.getElementById('admin-password');
const lobbyPlayers = document.getElementById('lobby-players');
const lobbyCount = document.getElementById('lobby-count');
const startBtn = document.getElementById('start-btn');
const forceStartBtn = document.getElementById('force-start-btn');
const adminLobbyControls = document.getElementById('admin-lobby-controls');
const lobbyMsg = document.getElementById('lobby-msg');

const nominationPanel = document.getElementById('nomination-panel');
const nominatorLabel = document.getElementById('nominator-label');
const nominateControls = document.getElementById('nominate-controls');
const waitingMsg = document.getElementById('waiting-msg');
const teamSelect = document.getElementById('team-select');
const startingBidInput = document.getElementById('starting-bid');
const nominateBtn = document.getElementById('nominate-btn');

const auctionPanel = document.getElementById('auction-panel');
const auctionSeed = document.getElementById('auction-seed');
const auctionTeamName = document.getElementById('auction-team-name');
const auctionRegion = document.getElementById('auction-region');
const timerText = document.getElementById('timer-text');
const timerCircle = document.getElementById('timer-circle');
const currentBidAmount = document.getElementById('current-bid-amount');
const currentBidder = document.getElementById('current-bidder');
const bidInput = document.getElementById('bid-input');
const bidBtn = document.getElementById('bid-btn');

const soldPanel = document.getElementById('sold-panel');
const soldTeam = document.getElementById('sold-team');
const soldWinner = document.getElementById('sold-winner');
const soldPrice = document.getElementById('sold-price');

const errorToast = document.getElementById('error-toast');
const activityEntries = document.getElementById('activity-entries');

const yourBudget = document.getElementById('your-budget');
const yourMaxBid = document.getElementById('your-max-bid');
const yourSpent = document.getElementById('your-spent');
const yourTeams = document.getElementById('your-teams');

const draftBoard = document.getElementById('draft-board');
const draftProgressText = document.getElementById('draft-progress-text');
const progressFill = document.getElementById('progress-fill');

const resultsGrid = document.getElementById('results-grid');
const copyBtn = document.getElementById('copy-btn');
const copyMsg = document.getElementById('copy-msg');

const connectionStatus = document.getElementById('connection-status');
const pausedOverlay = document.getElementById('paused-overlay');

// Admin elements
const adminBar = document.getElementById('admin-bar');
const adminPauseBtn = document.getElementById('admin-pause-btn');
const adminResumeBtn = document.getElementById('admin-resume-btn');
const adminSkipBtn = document.getElementById('admin-skip-btn');
const adminPanelToggle = document.getElementById('admin-panel-toggle');
const adminKickToggle = document.getElementById('admin-kick-toggle');
const adminSalesModal = document.getElementById('admin-sales-modal');
const adminKickModal = document.getElementById('admin-kick-modal');

// ─── Screen Management ───────────────────────────────────────────────────────

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ─── Error Toast ─────────────────────────────────────────────────────────────

let errorTimeout = null;
function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.add('visible');
  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(() => errorToast.classList.remove('visible'), 3000);
}

// ─── Connection Status ───────────────────────────────────────────────────────

socket.on('connect', () => {
  connectionStatus.className = 'connection-status connected';
  connectionStatus.querySelector('.status-text').textContent = 'Connected';
  // Auto-rejoin if we had a name
  if (myName) {
    const password = myName === 'Neff' ? sessionStorage.getItem('adminPw') : undefined;
    socket.emit('join', { name: myName, password });
  }
});

socket.on('disconnect', () => {
  connectionStatus.className = 'connection-status disconnected';
  connectionStatus.querySelector('.status-text').textContent = 'Reconnecting...';
});

// ─── Join Flow ───────────────────────────────────────────────────────────────

let participantNames = [];
socket.on('participantList', (names) => {
  participantNames = names;
  joinSelect.innerHTML = '<option value="">-- Pick a name --</option>';
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    joinSelect.appendChild(opt);
  });
});

// Show/hide password field based on selected name
joinSelect.addEventListener('change', () => {
  const isAdmin = joinSelect.value === 'Neff';
  passwordRow.style.display = isAdmin ? 'block' : 'none';
  if (!isAdmin) adminPasswordInput.value = '';
});

joinBtn.addEventListener('click', () => {
  const name = joinSelect.value;
  if (!name) {
    joinError.textContent = 'Please select a name.';
    return;
  }
  joinError.textContent = '';
  myName = name;

  const payload = { name };
  if (name === 'Neff') {
    payload.password = adminPasswordInput.value;
    sessionStorage.setItem('adminPw', payload.password);
  }
  socket.emit('join', payload);
});

// Handle Enter key on password field
adminPasswordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtn.click();
});

// ─── Kicked ──────────────────────────────────────────────────────────────────

socket.on('kicked', (msg) => {
  myName = null;
  document.getElementById('kicked-msg').textContent = msg;
  showScreen('kicked');
});

// ─── Lobby Manage Players ─────────────────────────────────────────────────────

document.getElementById('lobby-manage-players-btn').addEventListener('click', () => {
  adminPlayersModal.style.display = 'flex';
  populateAdminPlayersList();
});

// ─── Start Draft ─────────────────────────────────────────────────────────────

startBtn.addEventListener('click', () => {
  socket.emit('startDraft');
});

forceStartBtn.addEventListener('click', () => {
  if (confirm('Start the draft without all players? Missing players will be skipped.')) {
    socket.emit('forceStartDraft');
  }
});

// ─── Nomination ──────────────────────────────────────────────────────────────

nominateBtn.addEventListener('click', () => {
  const teamName = teamSelect.value;
  const startingBid = parseInt(startingBidInput.value) || 1;
  if (!teamName) {
    showError('Please select a team to nominate.');
    return;
  }
  socket.emit('nominate', { teamName, startingBid });
});

// ─── Bidding ─────────────────────────────────────────────────────────────────

// Track when user manually edits the bid input
bidInput.addEventListener('input', () => {
  userEditedBid = true;
});
bidInput.addEventListener('focus', () => {
  userEditedBid = true;
});

bidBtn.addEventListener('click', () => {
  const amount = parseInt(bidInput.value);
  if (!amount || isNaN(amount)) {
    showError('Enter a valid bid amount.');
    return;
  }
  socket.emit('placeBid', amount);
  userEditedBid = false; // Reset after placing bid
});

document.querySelectorAll('.bid-quick').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentState || !currentState.currentAuction) return;
    const increment = parseInt(btn.dataset.increment);
    const newBid = currentState.currentAuction.highBid + increment;
    socket.emit('placeBid', newBid);
    userEditedBid = false;
  });
});

// Keyboard shortcut: Enter to bid
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && currentState?.phase === 'auction' && document.activeElement === bidInput) {
    bidBtn.click();
  }
});

// ─── Admin Controls ──────────────────────────────────────────────────────────

adminPauseBtn.addEventListener('click', () => socket.emit('adminPause'));
adminResumeBtn.addEventListener('click', () => socket.emit('adminResume'));
adminSkipBtn.addEventListener('click', () => {
  if (confirm('Skip the current nomination turn?')) {
    socket.emit('adminSkipNomination');
  }
});

adminPanelToggle.addEventListener('click', () => {
  adminSalesModal.style.display = 'flex';
  populateAdminSalesDropdowns();
});

adminKickToggle.addEventListener('click', () => {
  adminKickModal.style.display = 'flex';
  populateAdminKickDropdown();
});

const adminPlayersToggle = document.getElementById('admin-players-toggle');
const adminPlayersModal = document.getElementById('admin-players-modal');

adminPlayersToggle.addEventListener('click', () => {
  adminPlayersModal.style.display = 'flex';
  populateAdminPlayersList();
});

document.getElementById('admin-update-sale-btn').addEventListener('click', () => {
  const teamName = document.getElementById('admin-sale-team').value;
  const newPrice = parseInt(document.getElementById('admin-new-price').value);
  if (!teamName || !newPrice) return;
  socket.emit('adminUpdateSale', { teamName, newPrice });
  adminSalesModal.style.display = 'none';
});

document.getElementById('admin-remove-sale-btn').addEventListener('click', () => {
  const teamName = document.getElementById('admin-remove-team').value;
  if (!teamName) return;
  if (confirm(`Remove ${teamName} from the draft and refund the buyer?`)) {
    socket.emit('adminRemoveSale', { teamName });
    adminSalesModal.style.display = 'none';
  }
});

document.getElementById('admin-kick-btn').addEventListener('click', () => {
  const name = document.getElementById('admin-kick-player').value;
  if (!name) return;
  if (confirm(`Kick ${name} from the draft?`)) {
    socket.emit('adminKickPlayer', { name });
    adminKickModal.style.display = 'none';
  }
});

// Restart draft
const adminRestartModal = document.getElementById('admin-restart-modal');
const restartConfirmInput = document.getElementById('restart-confirm-input');
const adminRestartBtn = document.getElementById('admin-restart-btn');

document.getElementById('admin-restart-toggle').addEventListener('click', () => {
  adminRestartModal.style.display = 'flex';
  restartConfirmInput.value = '';
  adminRestartBtn.disabled = true;
});

restartConfirmInput.addEventListener('input', () => {
  adminRestartBtn.disabled = restartConfirmInput.value.trim() !== 'RESTART';
});

adminRestartBtn.addEventListener('click', () => {
  if (restartConfirmInput.value.trim() !== 'RESTART') return;
  socket.emit('adminRestartDraft');
  adminRestartModal.style.display = 'none';
  restartConfirmInput.value = '';
  adminRestartBtn.disabled = true;
});

// Mobile tabs
document.querySelectorAll('.mobile-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // Show/hide panels
    document.querySelectorAll('[data-panel]').forEach(panel => {
      panel.classList.remove('mobile-hidden', 'mobile-visible');
      if (panel.dataset.panel === target) {
        panel.classList.add('mobile-visible');
      } else {
        panel.classList.add('mobile-hidden');
      }
    });
  });
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

function populateAdminSalesDropdowns() {
  if (!currentState) return;
  const saleTeamSelect = document.getElementById('admin-sale-team');
  const removeTeamSelect = document.getElementById('admin-remove-team');

  saleTeamSelect.innerHTML = '<option value="">-- Select team --</option>';
  removeTeamSelect.innerHTML = '<option value="">-- Select team --</option>';

  for (const entry of currentState.draftLog) {
    const label = `${entry.team} (${entry.seed}) — ${entry.winner} — $${entry.price}`;
    const opt1 = document.createElement('option');
    opt1.value = entry.team;
    opt1.textContent = label;
    saleTeamSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = entry.team;
    opt2.textContent = label;
    removeTeamSelect.appendChild(opt2);
  }
}

function populateAdminKickDropdown() {
  if (!currentState) return;
  const kickSelect = document.getElementById('admin-kick-player');
  kickSelect.innerHTML = '<option value="">-- Select player --</option>';

  for (const name of currentState.participantOrder) {
    if (name === 'Neff') continue; // Can't kick yourself
    const p = currentState.participants[name];
    if (!p.joined) continue;
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} ${p.online ? '(online)' : '(offline)'}`;
    kickSelect.appendChild(opt);
  }
}

function populateAdminPlayersList() {
  if (!currentState) return;
  const list = document.getElementById('admin-players-list');
  list.innerHTML = '';

  for (const name of currentState.participantOrder) {
    if (name === 'Neff') continue;
    const p = currentState.participants[name];
    const row = document.createElement('div');
    row.className = 'admin-player-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'admin-player-name';
    nameSpan.textContent = name;
    if (!p.online && p.joined) nameSpan.classList.add('offline');

    const controls = document.createElement('div');
    controls.className = 'admin-player-controls';

    const disableBtn = document.createElement('button');
    disableBtn.className = 'btn-admin btn-toggle' + (p.disabled ? ' active-red' : '');
    disableBtn.textContent = p.disabled ? 'Disabled' : 'Disable';
    disableBtn.addEventListener('click', () => {
      socket.emit('adminToggleDisable', { name });
      setTimeout(populateAdminPlayersList, 300);
    });

    const autoBtn = document.createElement('button');
    autoBtn.className = 'btn-admin btn-toggle' + (p.autoDraft ? ' active-green' : '');
    autoBtn.textContent = p.autoDraft ? 'Auto-Draft ON' : 'Auto-Draft';
    autoBtn.addEventListener('click', () => {
      socket.emit('adminToggleAutoDraft', { name });
      setTimeout(populateAdminPlayersList, 300);
    });

    controls.appendChild(autoBtn);
    controls.appendChild(disableBtn);
    row.appendChild(nameSpan);
    row.appendChild(controls);
    list.appendChild(row);
  }
}

// ─── Copy Results ────────────────────────────────────────────────────────────

copyBtn.addEventListener('click', () => {
  if (!currentState) return;
  let text = 'Participant\tTeam\tSeed\tRegion\tPrice\n';
  for (const entry of currentState.draftLog) {
    text += `${entry.winner}\t${entry.team}\t${entry.seed}\t${entry.region}\t$${entry.price}\n`;
  }
  navigator.clipboard.writeText(text).then(() => {
    copyMsg.textContent = 'Copied to clipboard!';
    setTimeout(() => copyMsg.textContent = '', 2000);
  });
});

// ─── State Update ────────────────────────────────────────────────────────────

socket.on('stateUpdate', (state) => {
  currentState = state;
  render(state);
});

socket.on('stateUpdatePublic', (state) => {
  if (!myName) {
    currentState = state;
  }
});

socket.on('error', (msg) => {
  if (screens.join.classList.contains('active')) {
    joinError.textContent = msg;
  } else {
    showError(msg);
  }
});

// ─── Render ──────────────────────────────────────────────────────────────────

function render(state) {
  const phase = state.phase;

  if (phase === 'lobby') {
    showScreen('lobby');
    renderLobby(state);
  } else if (phase === 'finished') {
    showScreen('results');
    renderResults(state);
  } else {
    showScreen('draft');
    renderDraft(state);
  }
}

function renderLobby(state) {
  const names = state.participantOrder;
  lobbyPlayers.innerHTML = '';
  let joinedCount = 0;
  let activeCount = 0;
  names.forEach(name => {
    const p = state.participants[name];
    const div = document.createElement('div');
    div.className = 'lobby-player';
    if (p.disabled) {
      div.classList.add('disabled-player');
      div.textContent = name + ' (disabled)';
    } else if (p.autoDraft) {
      div.classList.add('joined', 'auto-draft-player');
      div.textContent = name + ' (auto)';
      activeCount++;
      joinedCount++; // auto-draft counts as joined
    } else if (p.joined) {
      div.classList.add('joined');
      div.textContent = name;
      activeCount++;
      joinedCount++;
    } else {
      div.textContent = name;
      activeCount++;
    }
    lobbyPlayers.appendChild(div);
  });
  lobbyCount.textContent = `${joinedCount} / ${activeCount} joined`;

  const isAdmin = state.isAdminAuthenticated;

  if (isAdmin) {
    adminLobbyControls.style.display = 'block';
    if (joinedCount >= activeCount && activeCount > 0) {
      startBtn.style.display = 'inline-block';
      forceStartBtn.style.display = 'none';
      lobbyMsg.textContent = '';
    } else {
      startBtn.style.display = 'none';
      forceStartBtn.style.display = 'inline-block';
      lobbyMsg.textContent = 'Waiting for all participants to join...';
    }
  } else {
    adminLobbyControls.style.display = 'none';
    if (joinedCount >= activeCount && activeCount > 0) {
      lobbyMsg.textContent = 'Waiting for Neff to start the draft...';
    } else {
      lobbyMsg.textContent = 'Waiting for all participants to join...';
    }
  }
}

function renderDraft(state) {
  // Admin bar
  if (state.isAdminAuthenticated) {
    adminBar.style.display = 'flex';
    if (state.phase === 'paused') {
      adminPauseBtn.style.display = 'none';
      adminResumeBtn.style.display = 'inline-block';
    } else {
      adminPauseBtn.style.display = 'inline-block';
      adminResumeBtn.style.display = 'none';
    }
  } else {
    adminBar.style.display = 'none';
  }

  // Paused overlay
  if (state.phase === 'paused' && !state.isAdminAuthenticated) {
    pausedOverlay.style.display = 'flex';
  } else {
    pausedOverlay.style.display = 'none';
  }

  // Progress
  const pct = (state.totalTeamsDrafted / state.totalTeams) * 100;
  draftProgressText.textContent = `${state.totalTeamsDrafted} / ${state.totalTeams} teams drafted`;
  progressFill.style.width = pct + '%';

  // Your info
  yourBudget.textContent = '$' + state.yourBudget;
  yourMaxBid.textContent = '$' + state.yourMaxBid;
  const spent = 200 - state.yourBudget;
  yourSpent.textContent = '$' + spent;

  // Your teams
  yourTeams.innerHTML = '';
  state.yourTeams.forEach(t => {
    const div = document.createElement('div');
    div.className = 'team-list-item';
    div.innerHTML = `
      <span class="seed-badge">${t.seed}</span>
      <span class="team-name">${t.name}</span>
      <span class="team-price">$${t.price}</span>
    `;
    yourTeams.appendChild(div);
  });
  if (state.yourTeams.length === 0) {
    yourTeams.innerHTML = '<div class="subtle-msg" style="padding:8px;">No teams yet</div>';
  }

  // Draft board
  renderDraftBoard(state);

  // Activity log
  renderActivityLog(state);

  // Auction panels
  nominationPanel.style.display = 'none';
  auctionPanel.style.display = 'none';
  soldPanel.style.display = 'none';

  if (state.phase === 'drafting' || state.phase === 'paused') {
    nominationPanel.style.display = 'block';
    const isMyTurn = state.nominator === myName;

    if (isMyTurn && state.phase !== 'paused') {
      nominatorLabel.textContent = 'Your turn to nominate!';
      nominatorLabel.className = 'your-turn-glow';
      nominateControls.style.display = 'flex';
      waitingMsg.style.display = 'none';

      teamSelect.innerHTML = '<option value="">-- Select a team --</option>';
      const teams = [...state.remainingTeams].sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
      const dv = state.draftValues || {};
      teams.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.name;
        const val = dv[t.name] || '?';
        opt.textContent = `(${t.seed}) ${t.name} — ${t.region} — Neffy's Model: $${val}`;
        teamSelect.appendChild(opt);
      });
    } else {
      const nominatorData = state.nominator ? state.participants[state.nominator] : null;
      const isNominatorAuto = nominatorData && nominatorData.autoDraft;
      nominatorLabel.textContent = state.phase === 'paused'
        ? 'Draft is paused...'
        : isNominatorAuto
          ? `${state.nominator} (auto-draft) is nominating...`
          : `${state.nominator} is choosing a team to nominate...`;
      nominatorLabel.className = '';
      nominateControls.style.display = 'none';
      waitingMsg.style.display = 'block';
      waitingMsg.textContent = state.phase === 'paused'
        ? 'Waiting for admin to resume...'
        : isNominatorAuto
          ? 'Auto-drafting...'
          : 'Waiting for nomination...';
    }
  } else if (state.phase === 'auction') {
    auctionPanel.style.display = 'block';
    const auction = state.currentAuction;
    auctionSeed.textContent = auction.seed;
    auctionTeamName.textContent = auction.team;
    auctionRegion.textContent = auction.region;
    const auctionDraftValue = document.getElementById('auction-draft-value');
    const dvs = state.draftValues || {};
    auctionDraftValue.innerHTML = `<span class="neffys-model">Neffy's Model</span> $${dvs[auction.team] || '?'}`;

    // Timer
    const timeLeft = auction.timeLeft;
    timerText.textContent = timeLeft;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference * (1 - timeLeft / 10);
    timerCircle.style.strokeDashoffset = offset;

    if (timeLeft <= 3) {
      timerCircle.classList.add('urgent');
      timerText.classList.add('urgent');
    } else {
      timerCircle.classList.remove('urgent');
      timerText.classList.remove('urgent');
    }

    // Bid display
    currentBidAmount.textContent = auction.highBid;
    currentBidder.textContent = auction.highBidder;

    // Track high bid changes but don't auto-fill the input
    if (auction.highBid !== lastKnownHighBid) {
      lastKnownHighBid = auction.highBid;
    }

    // Disable bid controls if player is at max teams or can't bid higher
    const myData = state.participants[myName];
    const canBid = myData && myData.teams.length < 5 && state.yourMaxBid > auction.highBid;
    const bidControls = document.querySelector('.bid-controls');
    if (canBid) {
      bidControls.classList.remove('disabled');
    } else {
      bidControls.classList.add('disabled');
    }

    // Highlight if you're the high bidder
    const bidDisplay = document.querySelector('.current-bid-display');
    if (auction.highBidder === myName) {
      bidDisplay.classList.add('you-leading');
    } else {
      bidDisplay.classList.remove('you-leading');
    }
  } else if (state.phase === 'sold') {
    soldPanel.style.display = 'block';
    const auction = state.currentAuction;
    soldTeam.textContent = auction.team;
    soldWinner.textContent = auction.soldTo;
    soldPrice.textContent = auction.soldPrice;

    // Reset bid tracking for next auction
    lastKnownHighBid = null;
    userEditedBid = false;
    bidInput.value = '';
  }
}

function renderDraftBoard(state) {
  draftBoard.innerHTML = '';
  const names = state.participantOrder;
  names.forEach(name => {
    const p = state.participants[name];
    if (p.disabled) return; // hide disabled players from draft board
    const div = document.createElement('div');
    div.className = 'board-player';
    if (state.nominator === name) div.classList.add('is-nominator');
    if (name === myName) div.classList.add('is-you');
    if (!p.online && p.joined) div.classList.add('is-offline');
    if (p.autoDraft) div.classList.add('is-auto-draft');

    const header = document.createElement('div');
    header.className = 'board-player-header';
    header.innerHTML = `
      <span class="board-player-name">
        ${!p.online && p.joined ? '<span class="offline-dot" title="Offline"></span>' : ''}
        ${p.autoDraft ? '<span class="auto-badge" title="Auto-Draft">AUTO</span>' : ''}
        ${name}
      </span>
      <span class="board-player-stats">
        <span class="stat-teams">${p.teamCount}/5</span>
        <span class="stat-budget">$${p.budget}</span>
      </span>
    `;

    const teamsDiv = document.createElement('div');
    teamsDiv.className = 'board-player-teams';
    p.teams.forEach(t => {
      const row = document.createElement('div');
      row.className = 'board-team-row';
      row.innerHTML = `
        <span class="team-seed-name">
          <span class="mini-seed">${t.seed}</span>
          ${t.name}
        </span>
        <span style="color:var(--gold);font-weight:700;">$${t.price}</span>
      `;
      teamsDiv.appendChild(row);
    });

    div.appendChild(header);
    div.appendChild(teamsDiv);

    header.addEventListener('click', () => {
      div.classList.toggle('expanded');
    });

    draftBoard.appendChild(div);
  });
}

function renderActivityLog(state) {
  if (!state.activityLog || state.activityLog.length === 0) return;
  activityEntries.innerHTML = '';
  // Show last 8 entries
  const recent = state.activityLog.slice(-8);
  recent.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'activity-entry';
    div.textContent = entry.message;
    activityEntries.appendChild(div);
  });
  activityEntries.scrollTop = activityEntries.scrollHeight;
}

function renderResults(state) {
  resultsGrid.innerHTML = '';
  const names = state.participantOrder;
  names.forEach(name => {
    const p = state.participants[name];
    if (p.disabled) return;
    const card = document.createElement('div');
    card.className = 'result-card';

    const totalSpent = p.teams.reduce((sum, t) => sum + t.price, 0);
    let html = `<h4>${name}</h4><div class="result-total">Total: $${totalSpent} | Remaining: $${p.budget}</div>`;

    p.teams
      .sort((a, b) => a.seed - b.seed)
      .forEach(t => {
        html += `
          <div class="result-team">
            <span class="result-team-info">
              <span class="mini-seed">${t.seed}</span>
              ${t.name}
            </span>
            <span style="color:var(--gold);font-weight:700;">$${t.price}</span>
          </div>
        `;
      });

    card.innerHTML = html;
    resultsGrid.appendChild(card);
  });
}
