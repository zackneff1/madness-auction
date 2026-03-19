const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ─── Configuration ───────────────────────────────────────────────────────────

const PARTICIPANTS = [
  'Neff',
  'Dweezy',
  'J. Gordo',
  'Schmoo',
  'Ruby',
  'Joey',
  'Gottes',
  'Klaus',
  'Shek',
  'Timmy',
  'Mark',
  'Steen',
];

const ADMIN_NAME = 'Neff';
const ADMIN_PASSWORD = 'DegoRijj1';

const STARTING_BUDGET = 200;
const TEAMS_PER_PLAYER = 5;
const TIMER_SECONDS = 10;
const TOTAL_TEAMS = 60;

// 2026 NCAA Tournament Teams by seed and region
// First Four play-in games (11 seeds): Texas/NC State (West), SMU/Miami OH (Midwest)
// Update these after First Four games are played!
const TEAMS = [
  // ── 1 seeds ──
  { name: 'Duke', seed: 1, region: 'East' },
  { name: 'Arizona', seed: 1, region: 'West' },
  { name: 'Michigan', seed: 1, region: 'Midwest' },
  { name: 'Florida', seed: 1, region: 'South' },
  // ── 2 seeds ──
  { name: 'UConn', seed: 2, region: 'East' },
  { name: 'Purdue', seed: 2, region: 'West' },
  { name: 'Iowa State', seed: 2, region: 'Midwest' },
  { name: 'Houston', seed: 2, region: 'South' },
  // ── 3 seeds ──
  { name: 'Michigan State', seed: 3, region: 'East' },
  { name: 'Gonzaga', seed: 3, region: 'West' },
  { name: 'Virginia', seed: 3, region: 'Midwest' },
  { name: 'Illinois', seed: 3, region: 'South' },
  // ── 4 seeds ──
  { name: 'Kansas', seed: 4, region: 'East' },
  { name: 'Arkansas', seed: 4, region: 'West' },
  { name: 'Alabama', seed: 4, region: 'Midwest' },
  { name: 'Nebraska', seed: 4, region: 'South' },
  // ── 5 seeds ──
  { name: "St. John's", seed: 5, region: 'East' },
  { name: 'Wisconsin', seed: 5, region: 'West' },
  { name: 'Texas Tech', seed: 5, region: 'Midwest' },
  { name: 'Vanderbilt', seed: 5, region: 'South' },
  // ── 6 seeds ──
  { name: 'Louisville', seed: 6, region: 'East' },
  { name: 'BYU', seed: 6, region: 'West' },
  { name: 'Tennessee', seed: 6, region: 'Midwest' },
  { name: 'North Carolina', seed: 6, region: 'South' },
  // ── 7 seeds ──
  { name: 'UCLA', seed: 7, region: 'East' },
  { name: 'Miami (FL)', seed: 7, region: 'West' },
  { name: 'Kentucky', seed: 7, region: 'Midwest' },
  { name: "Saint Mary's", seed: 7, region: 'South' },
  // ── 8 seeds ──
  { name: 'Ohio State', seed: 8, region: 'East' },
  { name: 'Villanova', seed: 8, region: 'West' },
  { name: 'Georgia', seed: 8, region: 'Midwest' },
  { name: 'Clemson', seed: 8, region: 'South' },
  // ── 9 seeds ──
  { name: 'TCU', seed: 9, region: 'East' },
  { name: 'Utah State', seed: 9, region: 'West' },
  { name: 'Saint Louis', seed: 9, region: 'Midwest' },
  { name: 'Iowa', seed: 9, region: 'South' },
  // ── 10 seeds ──
  { name: 'UCF', seed: 10, region: 'East' },
  { name: 'Missouri', seed: 10, region: 'West' },
  { name: 'Santa Clara', seed: 10, region: 'Midwest' },
  { name: 'Texas A&M', seed: 10, region: 'South' },
  // ── 11 seeds ──
  { name: 'South Florida', seed: 11, region: 'East' },
  { name: 'Texas', seed: 11, region: 'West' },       // First Four: Texas vs NC State — update winner
  { name: 'SMU', seed: 11, region: 'Midwest' },       // First Four: SMU vs Miami (OH) — update winner
  { name: 'VCU', seed: 11, region: 'South' },
  // ── 12 seeds ──
  { name: 'Northern Iowa', seed: 12, region: 'East' },
  { name: 'High Point', seed: 12, region: 'West' },
  { name: 'Akron', seed: 12, region: 'Midwest' },
  { name: 'McNeese', seed: 12, region: 'South' },
  // ── 13 seeds ──
  { name: 'Cal Baptist', seed: 13, region: 'East' },
  { name: 'Hawaii', seed: 13, region: 'West' },
  { name: 'Hofstra', seed: 13, region: 'Midwest' },
  { name: 'Troy', seed: 13, region: 'South' },
  // ── 14 seeds ──
  { name: 'North Dakota State', seed: 14, region: 'East' },
  { name: 'Kennesaw State', seed: 14, region: 'West' },
  { name: 'Wright State', seed: 14, region: 'Midwest' },
  { name: 'Penn', seed: 14, region: 'South' },
  // ── 15 seeds ──
  { name: 'Furman', seed: 15, region: 'East' },
  { name: 'Queens', seed: 15, region: 'West' },
  { name: 'Tennessee State', seed: 15, region: 'Midwest' },
  { name: 'Idaho', seed: 15, region: 'South' },
];

// ─── Draft Value Model (Neffy's Model) ──────────────────────────────────────
// Base expected wins per team (from CSV). Used as ratios for scaling draft values.
const BASE_EXPECTED_WINS = {
  'Michigan': 3.855, 'Duke': 3.832, 'Arizona': 3.725, 'Florida': 3.141,
  'Iowa State': 2.813, 'Houston': 2.732, 'Illinois': 2.638, 'Purdue': 2.599,
  'Gonzaga': 2.328, 'UConn': 2.273, 'Michigan State': 2.053, 'Virginia': 1.894,
  'Arkansas': 1.79, 'Nebraska': 1.738, 'Vanderbilt': 1.737, "St. John's": 1.704,
  'Alabama': 1.623, 'Kansas': 1.621, 'Wisconsin': 1.538, 'Texas Tech': 1.486,
  'Louisville': 1.426, 'Tennessee': 1.387, 'UCLA': 1.275, "Saint Mary's": 0.963,
  'Ohio State': 0.888, 'Kentucky': 0.886, 'BYU': 0.884, 'SMU': 0.88,
  'Miami (FL)': 0.878, 'North Carolina': 0.791, 'Iowa': 0.79, 'Georgia': 0.788,
  'Utah State': 0.722, 'Clemson': 0.661, 'Texas': 0.643, 'VCU': 0.625,
  'Villanova': 0.622, 'Missouri': 0.617, 'Santa Clara': 0.598, 'Texas A&M': 0.568,
  'TCU': 0.548, 'Saint Louis': 0.518, 'South Florida': 0.461, 'UCF': 0.419,
  'Akron': 0.337, 'Northern Iowa': 0.285, 'High Point': 0.256, 'McNeese': 0.248,
  'Hofstra': 0.201, 'Cal Baptist': 0.168, 'Troy': 0.158, 'Hawaii': 0.134,
  'North Dakota State': 0.119, 'Wright State': 0.087, 'Kennesaw State': 0.081,
  'Furman': 0.071, 'Penn': 0.062, 'Idaho': 0.06, 'Queens': 0.054,
  'Tennessee State': 0.052,
};

// Compute draft values scaled to a target budget using largest-remainder rounding
function computeDraftValues(targetBudget) {
  let totalEW = 0;
  for (const team of TEAMS) {
    totalEW += BASE_EXPECTED_WINS[team.name] || 0.01;
  }
  const values = {};
  let floorSum = 0;
  const remainders = [];
  for (const team of TEAMS) {
    const ew = BASE_EXPECTED_WINS[team.name] || 0.01;
    const raw = Math.max(1, (ew / totalEW) * targetBudget);
    const floored = Math.floor(raw);
    values[team.name] = floored;
    floorSum += floored;
    remainders.push({ name: team.name, remainder: raw - floored });
  }
  remainders.sort((a, b) => b.remainder - a.remainder);
  let leftover = targetBudget - floorSum;
  for (let i = 0; i < leftover && i < remainders.length; i++) {
    values[remainders[i].name]++;
  }
  return values;
}

function getDraftValues() {
  // Once locked (draft started), return the locked values
  if (state.lockedDraftValues) return state.lockedDraftValues;
  // In lobby, show preview based on current active player count
  const activeCount = getActiveParticipants().length || 1;
  return computeDraftValues(activeCount * STARTING_BUDGET);
}

// ─── Game State ──────────────────────────────────────────────────────────────

const state = {
  phase: 'lobby', // lobby | drafting | auction | sold | paused | finished
  participants: {},  // name -> { joined, socketId, budget, teams: [{name, seed, region, price}] }
  nominationIndex: 0,
  currentAuction: null, // { team, highBid, highBidder, timeLeft }
  draftedTeams: [],     // team names that have been drafted
  draftLog: [],         // { team, seed, region, winner, price }
  activityLog: [],      // { message, timestamp }
  pausedPhase: null,    // the phase to return to after unpausing
  lockedDraftValues: null, // frozen at draft start, null in lobby
};

// Initialize participants
PARTICIPANTS.forEach(name => {
  state.participants[name] = {
    joined: false,
    socketId: null,
    budget: STARTING_BUDGET,
    teams: [],
    disabled: false,
    autoDraft: false,
  };
});

// Track which sockets are admin-authenticated
const adminSockets = new Set();

let auctionTimer = null;
let autoNominateTimer = null;
let autoBidTimer = null;

// ─── Helper Functions ────────────────────────────────────────────────────────

function getActiveParticipants() {
  return PARTICIPANTS.filter(name => !state.participants[name].disabled);
}

function getJoinedCount() {
  return Object.values(state.participants).filter(p => (p.joined || p.autoDraft) && !p.disabled).length;
}

function allJoined() {
  const active = getActiveParticipants();
  return active.length > 0 && active.every(name => {
    const p = state.participants[name];
    return p.joined || p.autoDraft;
  });
}

function getRemainingTeams() {
  return TEAMS.filter(t => !state.draftedTeams.includes(t.name));
}

function getTeamsNeeded(participant) {
  return TEAMS_PER_PLAYER - participant.teams.length;
}

function getMaxBid(participant) {
  const slotsNeeded = getTeamsNeeded(participant);
  if (slotsNeeded <= 0) return 0;
  return participant.budget - (slotsNeeded - 1);
}

function getCurrentNominator() {
  const names = PARTICIPANTS;
  let idx = state.nominationIndex % names.length;
  let checked = 0;
  while (checked < names.length) {
    const name = names[idx];
    const p = state.participants[name];
    if (!p.disabled && p.teams.length < TEAMS_PER_PLAYER) {
      return name;
    }
    idx = (idx + 1) % names.length;
    state.nominationIndex++;
    checked++;
  }
  return null;
}

function isDraftComplete() {
  if (state.draftedTeams.length >= TOTAL_TEAMS) return true;
  const active = getActiveParticipants();
  return active.every(name => state.participants[name].teams.length >= TEAMS_PER_PLAYER);
}

function addActivity(message) {
  state.activityLog.push({ message, timestamp: Date.now() });
  // Keep last 50 entries
  if (state.activityLog.length > 50) {
    state.activityLog.shift();
  }
}

function buildClientState(forPlayer) {
  const participants = {};
  for (const [name, p] of Object.entries(state.participants)) {
    participants[name] = {
      joined: p.joined,
      online: p.socketId ? !!io.sockets.sockets.get(p.socketId) : false,
      budget: p.budget,
      teams: p.teams,
      teamCount: p.teams.length,
      disabled: p.disabled,
      autoDraft: p.autoDraft,
    };
  }

  return {
    phase: state.phase,
    participants,
    nominator: (state.phase === 'drafting' || state.phase === 'paused') ? getCurrentNominator() : null,
    currentAuction: state.currentAuction,
    remainingTeams: getRemainingTeams(),
    draftLog: state.draftLog,
    activityLog: state.activityLog,
    you: forPlayer,
    isAdmin: forPlayer === ADMIN_NAME,
    yourBudget: forPlayer ? state.participants[forPlayer]?.budget : null,
    yourMaxBid: forPlayer ? getMaxBid(state.participants[forPlayer]) : null,
    yourTeams: forPlayer ? state.participants[forPlayer]?.teams : [],
    totalTeamsDrafted: state.draftedTeams.length,
    totalTeams: TOTAL_TEAMS,
    participantOrder: PARTICIPANTS,
    draftValues: getDraftValues(),
  };
}

function broadcastState() {
  for (const [name, p] of Object.entries(state.participants)) {
    if (p.socketId) {
      const s = buildClientState(name);
      s.isAdminAuthenticated = adminSockets.has(p.socketId);
      io.to(p.socketId).emit('stateUpdate', s);
    }
  }
  io.emit('stateUpdatePublic', buildClientState(null));
}

function startAuctionTimer() {
  clearInterval(auctionTimer);
  auctionTimer = setInterval(() => {
    if (!state.currentAuction || state.phase === 'paused') {
      clearInterval(auctionTimer);
      return;
    }
    state.currentAuction.timeLeft--;
    if (state.currentAuction.timeLeft <= 0) {
      clearInterval(auctionTimer);
      clearTimeout(autoBidTimer);
      const auction = state.currentAuction;
      const winner = state.participants[auction.highBidder];
      const team = TEAMS.find(t => t.name === auction.team);

      winner.budget -= auction.highBid;
      winner.teams.push({
        name: team.name,
        seed: team.seed,
        region: team.region,
        price: auction.highBid,
      });
      state.draftedTeams.push(team.name);
      state.draftLog.push({
        team: team.name,
        seed: team.seed,
        region: team.region,
        winner: auction.highBidder,
        price: auction.highBid,
      });

      addActivity(`${auction.highBidder} won ${team.name} (${team.seed}) for $${auction.highBid}`);

      state.phase = 'sold';
      state.currentAuction = {
        ...auction,
        timeLeft: 0,
        soldTo: auction.highBidder,
        soldPrice: auction.highBid,
      };
      broadcastState();

      setTimeout(() => {
        state.currentAuction = null;
        if (isDraftComplete()) {
          state.phase = 'finished';
          addActivity('Draft complete!');
        } else {
          state.nominationIndex++;
          autoFillMinBidPlayers();
          if (isDraftComplete()) {
            state.phase = 'finished';
            addActivity('Draft complete!');
          } else {
            state.phase = 'drafting';
            scheduleAutoNominate();
          }
        }
        broadcastState();
      }, 3000);
    } else {
      broadcastState();
    }
  }, 1000);
}

function scheduleAutoNominate() {
  clearTimeout(autoNominateTimer);
  if (state.phase !== 'drafting') return;

  const nominator = getCurrentNominator();
  if (!nominator) return;

  const p = state.participants[nominator];
  if (!p.autoDraft) return;

  autoNominateTimer = setTimeout(() => {
    if (state.phase !== 'drafting') return;
    // Re-check in case state changed
    const currentNom = getCurrentNominator();
    if (!currentNom || !state.participants[currentNom].autoDraft) return;

    // Pick best available team (lowest seed = highest ranked) at $1
    const remaining = getRemainingTeams().sort((a, b) => a.seed - b.seed || a.name.localeCompare(b.name));
    if (remaining.length === 0) return;

    const team = remaining[0];

    state.phase = 'auction';
    state.currentAuction = {
      team: team.name,
      seed: team.seed,
      region: team.region,
      highBid: 1,
      highBidder: currentNom,
      timeLeft: TIMER_SECONDS,
      nominatedBy: currentNom,
    };

    addActivity(`${currentNom} (auto) nominated ${team.name} (${team.seed}) at $1`);
    broadcastState();
    startAuctionTimer();
    scheduleAutoBid();
  }, 2000);
}

function scheduleAutoBid() {
  clearTimeout(autoBidTimer);
  if (state.phase !== 'auction' || !state.currentAuction) return;

  autoBidTimer = setTimeout(() => {
    if (state.phase !== 'auction' || !state.currentAuction) return;

    const auction = state.currentAuction;
    const draftValues = getDraftValues();
    const teamDraftValue = draftValues[auction.team];

    for (const name of PARTICIPANTS) {
      const p = state.participants[name];
      if (!p.autoDraft || p.disabled) continue;
      if (name === auction.highBidder) continue;
      if (p.teams.length >= TEAMS_PER_PLAYER) continue;

      const maxBid = getMaxBid(p);
      const targetBid = Math.min(teamDraftValue, maxBid);

      if (auction.highBid < targetBid) {
        const newBid = auction.highBid + 1;
        auction.highBid = newBid;
        auction.highBidder = name;
        auction.timeLeft = TIMER_SECONDS;
        addActivity(`${name} (auto) bid $${newBid} on ${auction.team}`);
        broadcastState();
        scheduleAutoBid(); // chain for next auto-bid
        return;
      }
    }
  }, 1500);
}

function autoFillMinBidPlayers() {
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of PARTICIPANTS) {
      const p = state.participants[name];
      if (p.disabled) continue;
      const needed = getTeamsNeeded(p);
      if (needed <= 0) continue;
      if (p.budget === needed) {
        const availableTeams = getRemainingTeams()
          .sort((a, b) => b.seed - a.seed);
        for (let i = 0; i < needed && availableTeams.length > 0; i++) {
          const team = availableTeams.shift();
          p.budget -= 1;
          p.teams.push({ name: team.name, seed: team.seed, region: team.region, price: 1 });
          state.draftedTeams.push(team.name);
          state.draftLog.push({
            team: team.name,
            seed: team.seed,
            region: team.region,
            winner: name,
            price: 1,
          });
          addActivity(`${name} auto-assigned ${team.name} (${team.seed}) for $1`);
        }
        changed = true;
      }
    }
  }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

app.get('/api/export-csv', (req, res) => {
  let csv = 'Participant,Team,Seed,Region,Price\n';
  for (const entry of state.draftLog) {
    const escapedTeam = entry.team.includes(',') ? `"${entry.team}"` : entry.team;
    const escapedWinner = entry.winner.includes(',') ? `"${entry.winner}"` : entry.winner;
    csv += `${escapedWinner},${escapedTeam},${entry.seed},${entry.region},${entry.price}\n`;
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=draft-results.csv');
  res.send(csv);
});

// ─── Socket.io Events ───────────────────────────────────────────────────────

io.on('connection', (socket) => {
  let playerName = null;

  socket.emit('participantList', PARTICIPANTS);

  socket.on('join', ({ name, password }) => {
    if (!state.participants[name]) {
      socket.emit('error', 'Invalid participant name.');
      return;
    }

    // Admin requires password
    if (name === ADMIN_NAME) {
      if (password !== ADMIN_PASSWORD) {
        socket.emit('error', 'Incorrect admin password.');
        return;
      }
      adminSockets.add(socket.id);
    }

    if (state.participants[name].joined && state.participants[name].socketId && state.participants[name].socketId !== socket.id) {
      const oldSocket = io.sockets.sockets.get(state.participants[name].socketId);
      if (oldSocket && oldSocket.connected) {
        // Admin can force-take their own seat back
        if (name === ADMIN_NAME) {
          oldSocket.emit('kicked', 'Admin reconnected from another session.');
          oldSocket.disconnect(true);
        } else {
          socket.emit('error', 'That name is already taken by an active player.');
          return;
        }
      }
    }

    playerName = name;
    state.participants[name].joined = true;
    state.participants[name].socketId = socket.id;

    addActivity(`${name} joined the draft`);
    broadcastState();
  });

  socket.on('leaveLobby', () => {
    if (!playerName || state.phase !== 'lobby') return;
    state.participants[playerName].joined = false;
    state.participants[playerName].socketId = null;
    adminSockets.delete(socket.id);
    addActivity(`${playerName} left the lobby`);
    playerName = null;
    broadcastState();
  });

  socket.on('startDraft', () => {
    if (state.phase !== 'lobby') return;
    if (playerName !== ADMIN_NAME || !adminSockets.has(socket.id)) {
      socket.emit('error', 'Only the admin (Neff) can start the draft.');
      return;
    }
    if (!allJoined()) {
      socket.emit('error', 'Not all participants have joined yet.');
      return;
    }
    // Lock draft values at draft start based on active player count
    const activeCount = getActiveParticipants().length;
    state.lockedDraftValues = computeDraftValues(activeCount * STARTING_BUDGET);
    state.phase = 'drafting';
    state.nominationIndex = 0;
    addActivity('Draft started!');
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('forceStartDraft', () => {
    if (state.phase !== 'lobby') return;
    if (playerName !== ADMIN_NAME || !adminSockets.has(socket.id)) {
      socket.emit('error', 'Only the admin can force-start.');
      return;
    }
    // Lock draft values at draft start based on active player count
    const activeCount = getActiveParticipants().length;
    state.lockedDraftValues = computeDraftValues(activeCount * STARTING_BUDGET);
    // Start even if not all players joined
    state.phase = 'drafting';
    state.nominationIndex = 0;
    addActivity('Draft force-started by admin');
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('nominate', ({ teamName, startingBid }) => {
    if (state.phase !== 'drafting') return;
    const nominator = getCurrentNominator();
    if (playerName !== nominator) {
      socket.emit('error', "It's not your turn to nominate.");
      return;
    }
    const team = TEAMS.find(t => t.name === teamName);
    if (!team || state.draftedTeams.includes(teamName)) {
      socket.emit('error', 'Invalid or already drafted team.');
      return;
    }
    const bid = Math.max(1, Math.floor(Number(startingBid) || 1));
    const p = state.participants[playerName];
    if (bid > getMaxBid(p)) {
      socket.emit('error', 'Starting bid exceeds your maximum allowed bid.');
      return;
    }

    state.phase = 'auction';
    state.currentAuction = {
      team: team.name,
      seed: team.seed,
      region: team.region,
      highBid: bid,
      highBidder: playerName,
      timeLeft: TIMER_SECONDS,
      nominatedBy: playerName,
    };

    addActivity(`${playerName} nominated ${team.name} (${team.seed}) at $${bid}`);
    broadcastState();
    startAuctionTimer();
    scheduleAutoBid();
  });

  socket.on('placeBid', (amount) => {
    if (state.phase !== 'auction' || !state.currentAuction) return;
    if (!playerName) return;

    const bid = Math.floor(Number(amount));
    const p = state.participants[playerName];
    const auction = state.currentAuction;

    if (p.teams.length >= TEAMS_PER_PLAYER) {
      socket.emit('error', 'You already have the maximum number of teams.');
      return;
    }
    if (bid <= auction.highBid) {
      socket.emit('error', `Bid must be higher than current bid of $${auction.highBid}.`);
      return;
    }
    if (bid > getMaxBid(p)) {
      socket.emit('error', `Your maximum allowed bid is $${getMaxBid(p)}.`);
      return;
    }

    auction.highBid = bid;
    auction.highBidder = playerName;
    auction.timeLeft = TIMER_SECONDS;

    addActivity(`${playerName} bid $${bid} on ${auction.team}`);
    broadcastState();
    scheduleAutoBid();
  });

  // ─── Admin Commands ──────────────────────────────────────────────────────

  socket.on('adminPause', () => {
    if (!adminSockets.has(socket.id)) return;
    if (state.phase === 'paused' || state.phase === 'lobby' || state.phase === 'finished') return;

    state.pausedPhase = state.phase;
    if (state.phase === 'auction') {
      clearInterval(auctionTimer);
      clearTimeout(autoBidTimer);
    }
    state.phase = 'paused';
    addActivity('Draft paused by admin');
    broadcastState();
  });

  socket.on('adminResume', () => {
    if (!adminSockets.has(socket.id)) return;
    if (state.phase !== 'paused') return;

    state.phase = state.pausedPhase;
    state.pausedPhase = null;
    if (state.phase === 'auction' && state.currentAuction) {
      startAuctionTimer();
      scheduleAutoBid();
    }
    addActivity('Draft resumed by admin');
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('adminUpdateSale', ({ teamName, newPrice }) => {
    if (!adminSockets.has(socket.id)) return;
    const price = Math.max(1, Math.floor(Number(newPrice)));

    // Find in draft log
    const logEntry = state.draftLog.find(e => e.team === teamName);
    if (!logEntry) {
      socket.emit('error', 'Team not found in draft log.');
      return;
    }

    const ownerName = logEntry.winner;
    const owner = state.participants[ownerName];
    const teamEntry = owner.teams.find(t => t.name === teamName);
    if (!teamEntry) {
      socket.emit('error', 'Team not found in player roster.');
      return;
    }

    const oldPrice = teamEntry.price;
    const priceDiff = price - oldPrice;

    // Check if owner can afford the new price
    if (owner.budget - priceDiff < 0) {
      socket.emit('error', `${ownerName} cannot afford this price change (budget would go to $${owner.budget - priceDiff}).`);
      return;
    }

    teamEntry.price = price;
    logEntry.price = price;
    owner.budget -= priceDiff;

    addActivity(`Admin updated ${teamName} price: $${oldPrice} → $${price} (${ownerName})`);
    broadcastState();
  });

  socket.on('adminRemoveSale', ({ teamName }) => {
    if (!adminSockets.has(socket.id)) return;

    const logIndex = state.draftLog.findIndex(e => e.team === teamName);
    if (logIndex === -1) {
      socket.emit('error', 'Team not found in draft log.');
      return;
    }

    const logEntry = state.draftLog[logIndex];
    const ownerName = logEntry.winner;
    const owner = state.participants[ownerName];

    // Refund the price
    owner.budget += logEntry.price;
    owner.teams = owner.teams.filter(t => t.name !== teamName);

    // Remove from drafted teams
    state.draftedTeams = state.draftedTeams.filter(t => t !== teamName);
    state.draftLog.splice(logIndex, 1);

    addActivity(`Admin removed ${teamName} from ${ownerName} (refunded $${logEntry.price})`);
    broadcastState();
  });

  socket.on('adminKickPlayer', ({ name }) => {
    if (!adminSockets.has(socket.id)) return;
    if (name === ADMIN_NAME) {
      socket.emit('error', "You can't kick yourself.");
      return;
    }
    if (!state.participants[name]) return;

    const p = state.participants[name];
    if (p.socketId) {
      const targetSocket = io.sockets.sockets.get(p.socketId);
      if (targetSocket) {
        targetSocket.emit('kicked', 'You have been removed by the admin. Please rejoin with your correct name.');
        targetSocket.disconnect(true);
      }
    }
    p.joined = false;
    p.socketId = null;

    addActivity(`Admin kicked ${name}`);
    broadcastState();
  });

  socket.on('adminRestartDraft', () => {
    if (!adminSockets.has(socket.id)) return;

    // Clear timers
    clearInterval(auctionTimer);
    clearTimeout(autoNominateTimer);
    clearTimeout(autoBidTimer);

    // Reset all participant state (keep joined/socketId/disabled/autoDraft)
    for (const name of PARTICIPANTS) {
      state.participants[name].budget = STARTING_BUDGET;
      state.participants[name].teams = [];
    }

    state.nominationIndex = 0;
    state.currentAuction = null;
    state.draftedTeams = [];
    state.draftLog = [];
    state.pausedPhase = null;
    state.activityLog = [];

    // Re-lock draft values based on current active player count
    const activeCount = getActiveParticipants().length;
    state.lockedDraftValues = computeDraftValues(activeCount * STARTING_BUDGET);
    state.phase = 'drafting';

    addActivity('Draft restarted by admin — all picks cleared');
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('adminSkipNomination', () => {
    if (!adminSockets.has(socket.id)) return;
    if (state.phase !== 'drafting' && state.phase !== 'paused') return;

    const skipped = getCurrentNominator();
    state.nominationIndex++;
    addActivity(`Admin skipped ${skipped}'s nomination turn`);
    if (state.phase === 'paused') {
      state.pausedPhase = 'drafting';
    }
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('adminToggleDisable', ({ name }) => {
    if (!adminSockets.has(socket.id)) return;
    if (name === ADMIN_NAME) {
      socket.emit('error', "You can't disable yourself.");
      return;
    }
    const p = state.participants[name];
    if (!p) return;

    p.disabled = !p.disabled;
    if (p.disabled) {
      p.autoDraft = false; // mutually exclusive
      addActivity(`Admin disabled ${name}`);
    } else {
      addActivity(`Admin enabled ${name}`);
    }
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('adminToggleAutoDraft', ({ name }) => {
    if (!adminSockets.has(socket.id)) return;
    if (name === ADMIN_NAME) {
      socket.emit('error', "You can't auto-draft yourself.");
      return;
    }
    const p = state.participants[name];
    if (!p) return;

    p.autoDraft = !p.autoDraft;
    if (p.autoDraft) {
      p.disabled = false; // mutually exclusive
      addActivity(`Admin enabled auto-draft for ${name}`);
    } else {
      addActivity(`Admin disabled auto-draft for ${name}`);
    }
    broadcastState();
    scheduleAutoNominate();
  });

  socket.on('disconnect', () => {
    if (playerName && state.participants[playerName]) {
      state.participants[playerName].socketId = null;
      adminSockets.delete(socket.id);
      addActivity(`${playerName} disconnected`);
      broadcastState();
    }
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`March Madness Auction Draft running on http://localhost:${PORT}`);
});
