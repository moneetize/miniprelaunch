const STORAGE_KEY = "moneetize-mini-prelaunch-v2";
const SCRATCH_LOCKED_TRIPTO = 250;
const SCRATCH_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;

const assets = {
  gem: "assets/gem.png",
  wildcard: "assets/wildcard.png",
  tshirt: "assets/moneetize-tshirt.png",
  avatar: "assets/rookie-avatar.png",
  aiBlue: "assets/ai-bubble-blue.png",
  aiGreen: "assets/ai-bubble-green.png",
};

const ticketPool = [
  {
    id: "blue",
    title: "Wild Scratch",
    displayName: "Blue Ticket",
    tier: "Common",
    probability: "45.0%",
    weight: 4500,
    isGolden: false,
    borderColor: "rgba(129, 140, 248, 0.65)",
    glowColor: "rgba(129, 140, 248, 0.22)",
    scratchGradient: "linear-gradient(135deg, #7586ff 0%, #d9f2ff 100%)",
    scratchBaseColor: "#8492ff",
    particleColors: ["#7fccff", "#524cff", "#a78bfa", "#f8fafc"],
    reward: {
      score: 20,
      level: 1,
      usdt: 0.5,
      wildCardName: "Starter Coordination Card",
      wildCardDescription: "A starter participation boost waiting to activate after registration.",
      participationBoost: "Starter participation boost",
      participationImpact: "Baseline coordination signal",
    },
  },
  {
    id: "aqua",
    title: "Wild Scratch",
    displayName: "Aqua Ticket",
    tier: "Common",
    probability: "30.0%",
    weight: 3000,
    isGolden: false,
    borderColor: "rgba(103, 232, 249, 0.55)",
    glowColor: "rgba(45, 212, 191, 0.2)",
    scratchGradient: "linear-gradient(135deg, #21c8f6 0%, #99f6a7 100%)",
    scratchBaseColor: "#36d3d8",
    particleColors: ["#22d3ee", "#6ee7b7", "#99f6e4", "#f8fafc"],
    reward: {
      score: 45,
      level: 2,
      usdt: 1,
      wildCardName: "Momentum Wild Card",
      wildCardDescription: "A brighter participation card with a stronger activation signal.",
      participationBoost: "Momentum boost",
      participationImpact: "Growing coordination signal",
    },
  },
  {
    id: "green",
    title: "Wild Scratch",
    displayName: "Green Ticket",
    tier: "Wild Card",
    probability: "18.0%",
    weight: 1800,
    isGolden: false,
    borderColor: "rgba(132, 204, 22, 0.62)",
    glowColor: "rgba(132, 204, 22, 0.2)",
    scratchGradient: "linear-gradient(135deg, #27c23a 0%, #e6ff6f 100%)",
    scratchBaseColor: "#8fd43f",
    particleColors: ["#84cc16", "#a3e635", "#fde047", "#ecfccb"],
    reward: {
      score: 75,
      level: 3,
      usdt: 3,
      wildCardName: "Boost Advantage Card",
      wildCardDescription: "Level 3 participation adds a boost advantage after sign-up.",
      participationBoost: "Boost advantage",
      participationImpact: "Stronger coordination signal",
    },
  },
  {
    id: "pink",
    title: "Wild Scratch",
    displayName: "Pink Ticket",
    tier: "Rare Wild Card",
    probability: "6.5%",
    weight: 650,
    isGolden: false,
    borderColor: "rgba(244, 114, 182, 0.58)",
    glowColor: "rgba(244, 114, 182, 0.2)",
    scratchGradient: "linear-gradient(135deg, #ff7a45 0%, #f9a8d4 100%)",
    scratchBaseColor: "#f58aa4",
    particleColors: ["#fb7185", "#f472b6", "#fdba74", "#fbcfe8"],
    reward: {
      score: 250,
      level: 4,
      usdt: 8,
      wildCardName: "Golden Eligibility Card",
      wildCardDescription: "Higher-level participation unlocks golden eligibility after registration.",
      participationBoost: "Enhanced coordination impact",
      participationImpact: "Golden eligibility",
      goldenEligibility: true,
    },
  },
  {
    id: "gold",
    title: "Golden Scratch",
    displayName: "Gold Ticket",
    tier: "Golden Ticket",
    probability: "0.5%",
    weight: 50,
    isGolden: true,
    borderColor: "rgba(212, 175, 55, 0.72)",
    glowColor: "rgba(212, 175, 55, 0.26)",
    scratchGradient: "linear-gradient(135deg, #c8941d 0%, #fde68a 100%)",
    scratchBaseColor: "#c4a661",
    particleColors: ["#fde68a", "#facc15", "#d97706", "#fef3c7"],
    countdown: { hours: 10, minutes: 8, seconds: 32 },
    reward: {
      score: 500,
      level: 5,
      usdt: 25,
      wildCardName: "Golden Apex Card",
      wildCardDescription: "A very rare coordination window with top-tier launch rewards.",
      participationBoost: "Major participation boost",
      participationImpact: "Golden Apex coordination window",
      goldenEligibility: true,
      goldenWindow: {
        active: true,
        title: "Golden Apex Active",
        subtext: "A high-intensity coordination window is active. Participants in this window generate the highest-value outcomes.",
        topRewards: ["$25+ USDT", "Shopping spree rewards", "Major participation boosts"],
      },
    },
  },
];

const defaultTeam = [
  { id: "andrew", name: "Andrew Smith", points: 397, status: "active", avatar: "AS" },
  { id: "john", name: "John Black", points: 30, status: "active", avatar: "JB" },
  { id: "jim", name: "Jim Kerry", points: 27, status: "active", avatar: "JK" },
  { id: "pending", name: "test@mail.com", points: 0, status: "pending", avatar: "" },
];

const recommendedPeople = [
  { name: "Maya Chen", detail: "Creator drops", status: "Following" },
  { name: "Alex McKein", detail: "Fitness picks", status: "Follow" },
  { name: "Nia Brooks", detail: "Team rewards", status: "Follow" },
  { name: "Olivia Bennett", detail: "Product finds", status: "Follow" },
];

const gameplayActions = [
  { label: "Referring a friend", points: "+20" },
  { label: "Sharing with a friend", points: "+10" },
  { label: "Signing up", points: "+10" },
  { label: "First-time action", points: "+5" },
  { label: "Daily check-in", points: "+2" },
  { label: "Taking a quiz", points: "+5-30" },
  { label: "Hidden products", points: "+10" },
  { label: "Portfolio performance", points: "+10" },
];

const app = document.querySelector("#app");
let state = loadState();

function getDefaultState() {
  return {
    step: "signup",
    profileTab: "your-team",
    teamCount: 4,
    currentDraw: null,
    history: [],
    inventory: [],
    balances: {
      points: 0,
      usdt: 0,
      gems: 0,
    },
    profile: {
      name: "Jess Wu",
      email: "",
      passwordSet: false,
      handle: "@healthyhabits",
      avatar: "blue",
      interests: ["Football", "Designer", "Dogs", "Tech"],
      rewardGoal: "Cash rewards",
      profileComplete: false,
    },
  };
}

function loadState() {
  const fallback = getDefaultState();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return {
      ...fallback,
      ...parsed,
      balances: { ...fallback.balances, ...(parsed.balances || {}) },
      profile: { ...fallback.profile, ...(parsed.profile || {}) },
      history: Array.isArray(parsed.history) ? parsed.history : [],
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function randomInt(maxExclusive) {
  if (window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function selectScratchTicket() {
  const totalWeight = ticketPool.reduce((sum, ticket) => sum + ticket.weight, 0);
  let roll = randomInt(totalWeight);

  for (const ticket of ticketPool) {
    if (roll < ticket.weight) return ticket;
    roll -= ticket.weight;
  }

  return ticketPool[0];
}

function createRewardItems(ticket) {
  const base = ticket.reward;
  const items = [
    {
      id: `${ticket.id}-points`,
      type: "points",
      label: "Participation Score",
      amount: base.score,
      unit: "pts",
      icon: "gem",
    },
    {
      id: `${ticket.id}-wild-card`,
      type: "wildcard",
      label: base.wildCardName,
      description: base.wildCardDescription,
      icon: "wildcard",
    },
    {
      id: `${ticket.id}-usdt`,
      type: "usdt",
      label: "USDT balance",
      amount: base.usdt,
      unit: "USDT",
      icon: "usdt",
    },
    {
      id: `${ticket.id}-tripto`,
      type: "tripto",
      label: "Gems (Tripto locked)",
      amount: SCRATCH_LOCKED_TRIPTO,
      unit: "Gems",
      icon: "gem",
    },
  ];

  const bonusChance = base.level >= 5 ? 100 : base.level === 4 ? 70 : base.level === 3 ? 45 : base.level === 2 ? 25 : 15;

  if (randomInt(100) < bonusChance) {
    items.splice(1, 0, {
      id: `${ticket.id}-moneetize-shirt`,
      type: "merch",
      label: "Moneetize Merch",
      description: "Launch team merch reward",
      icon: "shirt",
    });
  }

  return items;
}

function createScratchDraw() {
  const ticket = selectScratchTicket();
  const rewardItems = createRewardItems(ticket);
  const createdAt = new Date().toISOString();
  const draw = {
    id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `draw-${Date.now()}`,
    ticket: {
      id: ticket.id,
      title: ticket.title,
      displayName: ticket.displayName,
      tier: ticket.tier,
      probability: ticket.probability,
      isGolden: ticket.isGolden,
      borderColor: ticket.borderColor,
      glowColor: ticket.glowColor,
      scratchGradient: ticket.scratchGradient,
      scratchBaseColor: ticket.scratchBaseColor,
      particleColors: ticket.particleColors,
      countdown: ticket.countdown,
    },
    reward: {
      ...ticket.reward,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      items: rewardItems,
      expiresIn: SCRATCH_EXPIRATION_MS,
    },
    createdAt,
    expiresAt: new Date(Date.now() + SCRATCH_EXPIRATION_MS).toISOString(),
  };

  state.currentDraw = draw;
  state.balances.points += draw.reward.score;
  state.balances.usdt = Number((state.balances.usdt + draw.reward.usdt).toFixed(2));
  state.balances.gems += SCRATCH_LOCKED_TRIPTO;
  state.inventory = mergeInventory(state.inventory, rewardItems);
  state.history = [draw, ...state.history.filter((item) => item.id !== draw.id)].slice(0, 20);

  return draw;
}

function mergeInventory(current, items) {
  const next = [...current];

  for (const item of items) {
    const key = item.type === "merch" ? item.label : item.type;
    const existing = next.find((entry) => entry.key === key);

    if (existing) {
      existing.count += 1;
      if (typeof item.amount === "number") {
        existing.amount = Number(((existing.amount || 0) + item.amount).toFixed(2));
      }
    } else {
      next.push({
        key,
        type: item.type,
        label: item.label,
        amount: typeof item.amount === "number" ? item.amount : 1,
        unit: item.unit || "",
        count: 1,
      });
    }
  }

  return next;
}

function startScratch() {
  createScratchDraw();
  state.step = "scratch";
  saveState();
  render();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatUsdt(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function userInitials(name) {
  return String(name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function activeDraw() {
  if (!state.currentDraw) {
    createScratchDraw();
    saveState();
  }

  return state.currentDraw;
}

function render() {
  app.innerHTML = renderStep();
  afterRender();
}

function renderStep() {
  switch (state.step) {
    case "scratch":
      return renderScratchScreen();
    case "reveal":
      return renderRevealScreen();
    case "team":
      return renderTeamScreen();
    case "profile":
      return renderProfileScreen();
    case "settings":
      return renderSettingsScreen();
    default:
      return renderSignupScreen();
  }
}

function renderShell(content, className = "") {
  return `
    <main class="mobile-app ${className}">
      ${renderStatusBar()}
      ${content}
    </main>
  `;
}

function renderStatusBar() {
  return `
    <div class="status-bar" aria-hidden="true">
      <span>9:41</span>
      <span class="status-cutout"></span>
      <span class="status-icons">
        <span></span><span></span><span></span>
        <span class="battery">32</span>
      </span>
    </div>
  `;
}

function renderLogo() {
  return `
    <div class="brand-mark">
      <span class="brand-icon">M</span>
      <div>
        <strong>moneetize</strong>
        <span>Spend... with benefits</span>
      </div>
    </div>
  `;
}

function renderSignupScreen() {
  return renderShell(`
    <section class="flow-card signup-screen">
      ${renderLogo()}
      <div class="screen-title">
        <p>2</p>
        <h1>Sign Up</h1>
      </div>
      <form class="stack-form" data-form="signup">
        <label>
          <span>Email</span>
          <input type="email" name="email" placeholder="user@mail.com" value="${escapeHtml(state.profile.email)}" required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" placeholder="Password" required minlength="4" />
        </label>
        <label class="check-row">
          <input type="checkbox" name="remember" />
          <span>Remember me</span>
        </label>
        <button class="primary-cta" type="submit">Scratch Now</button>
      </form>
      <p class="subtle-link">Don't have an account? <button type="button" data-action="focus-signup">Sign up here</button></p>
    </section>
  `, "centered");
}

function renderScratchScreen() {
  const draw = activeDraw();
  const ticket = draw.ticket;
  const reward = draw.reward;
  const chipValues = ticket.isGolden ? [5, 10, 15, 25] : [0.5, 1, 3, 8];

  return renderShell(`
    <section class="flow-card scratch-screen" style="--ticket-gradient:${ticket.scratchGradient};--ticket-border:${ticket.borderColor};--ticket-glow:${ticket.glowColor};">
      ${renderLogo()}
      <p class="invite-note"><span class="avatar tiny">J</span> Johny invited you to</p>
      <h1>Scratch & Win</h1>
      <div class="amount-row">
        ${chipValues.map((amount) => `<span class="${amount === reward.usdt ? "is-current" : ""}">$${amount.toFixed(2)}</span>`).join("")}
      </div>
      <div class="scratch-stage" id="scratch-stage">
        <div class="ticket-result">
          <p>${escapeHtml(ticket.tier)}</p>
          <strong>${formatUsdt(reward.usdt)} USDT</strong>
          <span>+${reward.score} points</span>
        </div>
        <canvas id="scratch-canvas" aria-label="Scratch the ticket to reveal your reward"></canvas>
      </div>
      <button class="help-chip" type="button" data-action="show-odds">
        <img src="${assets.aiBlue}" alt="" />
        How rewards work
      </button>
      <div class="scratch-copy">
        <h2>Get more cash prizes!</h2>
        <p>Set up your team before the launch.</p>
      </div>
      ${renderAvatarRail()}
      <button class="secondary-cta" type="button" data-action="force-reveal">Reveal reward</button>
    </section>
  `, `centered ticket-${ticket.id}`);
}

function renderRevealScreen() {
  const draw = activeDraw();
  const reward = draw.reward;
  const ticket = draw.ticket;

  return renderShell(`
    <section class="reveal-screen">
      <div class="confetti confetti-a"></div>
      <div class="confetti confetti-b"></div>
      <div class="confetti confetti-c"></div>
      <img class="ai-prize" src="${ticket.isGolden ? assets.aiGreen : assets.aiBlue}" alt="Moneetize AI reward" />
      <h1>You've Won!</h1>
      <div class="win-amount">
        <strong>${formatUsdt(reward.usdt)}</strong>
        <span>USDT</span>
      </div>
      <p class="also-get">You also get:</p>
      <div class="reward-carousel">
        ${reward.items.map(renderRewardItem).join("")}
      </div>
      <button class="primary-cta" type="button" data-action="activate-rewards">Activate</button>
      <button class="secondary-cta" type="button" data-action="view-profile">View Profile</button>
    </section>
  `, `centered reveal-${ticket.id}`);
}

function renderTeamScreen() {
  const draw = activeDraw();
  const nextCount = Math.min(5, state.teamCount);

  return renderShell(`
    <section class="flow-card team-screen">
      <img class="mini-ai" src="${assets.aiGreen}" alt="Moneetize team assistant" />
      <h1>Keep Growing!</h1>
      <p>Only a team of 5 qualifies for the grand prize.</p>
      <div class="team-ties">
        <div>
          <h2>Your Money Ties</h2>
          <p>You and your friends earn another scratch when they accept your invitation.</p>
        </div>
        <strong>${nextCount}/5</strong>
        ${renderAvatarRail(true)}
        <button type="button" data-action="share-team">Share</button>
      </div>
      <div class="team-prizes" aria-label="Team reward examples">
        <article>
          <span>Common Ticket</span>
          <strong>Up to $1.00</strong>
          <div class="mini-ticket mini-ticket-common"></div>
        </article>
        <article>
          <span>Wild Card</span>
          <strong>Up to $8.00</strong>
          <div class="mini-ticket mini-ticket-wild"></div>
        </article>
        <article>
          <span>Golden Ticket</span>
          <strong>Up to $25.00</strong>
          <div class="mini-ticket mini-ticket-gold"></div>
        </article>
      </div>
      <div class="current-draw-note">
        <span>${escapeHtml(draw.ticket.tier)}</span>
        <strong>${formatUsdt(draw.reward.usdt)} + ${draw.reward.score} pts</strong>
      </div>
      <button class="primary-cta" type="button" data-action="view-profile">View Profile</button>
    </section>
  `, "centered");
}

function renderProfileScreen() {
  return renderShell(`
    <section class="profile-screen">
      ${!state.profile.profileComplete ? renderRegisterBanner() : ""}
      ${renderProfileHeader()}
      ${renderProfileTabs()}
      <div class="profile-content">
        ${renderProfileTabContent()}
      </div>
      <button class="secondary-cta back-to-scratch" type="button" data-action="new-scratch">Back to Scratch</button>
    </section>
  `);
}

function renderRegisterBanner() {
  return `
    <div class="register-banner">
      <div>
        <strong>Complete your on-boarding process and receive bonus points!</strong>
        <span>Finish name, email, password, avatar, and rewards profile.</span>
      </div>
      <button type="button" data-action="open-settings">Register</button>
    </div>
  `;
}

function renderProfileHeader() {
  const name = escapeHtml(state.profile.name || "Jess Wu");
  const handle = escapeHtml(state.profile.handle || "@healthyhabits");

  return `
    <header class="profile-hero">
      <div class="profile-actions">
        <button type="button" data-action="message">Message</button>
        <button type="button" data-action="open-settings">...</button>
      </div>
      <div class="avatar-ring">
        <img src="${assets.avatar}" alt="${name}" />
        <span>Rookie</span>
      </div>
      <h1>${name}</h1>
      <p>${handle}</p>
      <div class="profile-stats">
        <span><strong>${formatUsdt(state.balances.usdt)}</strong>Balance</span>
        <span><strong>76</strong>Following</span>
        <span><strong>46</strong>Followers</span>
      </div>
      <div class="points-pill">
        <img src="${assets.gem}" alt="" />
        <strong>${state.balances.points}</strong>
      </div>
    </header>
  `;
}

function renderProfileTabs() {
  const tabs = [
    ["your-team", "Your Team"],
    ["network", "Invited Team"],
    ["winnings", "Winnings"],
    ["gameplay", "Gameplay"],
  ];

  return `
    <nav class="tab-bar" aria-label="Profile sections">
      ${tabs.map(([id, label]) => `<button class="${state.profileTab === id ? "is-active" : ""}" type="button" data-tab="${id}">${label}</button>`).join("")}
    </nav>
  `;
}

function renderProfileTabContent() {
  if (state.profileTab === "network") return renderNetworkTab();
  if (state.profileTab === "winnings") return renderWinningsTab();
  if (state.profileTab === "gameplay") return renderGameplayTab();
  return renderYourTeamTab();
}

function renderYourTeamTab() {
  const team = [
    { id: "you", name: `${state.profile.name} (You)`, points: state.balances.points || 397, status: "active", avatar: "JW" },
    ...defaultTeam.slice(1),
  ].sort((a, b) => b.points - a.points);
  const progress = team.reduce((total, member) => total + member.points, 0);

  return `
    <section class="profile-section">
      <div class="section-heading">
        <h2>Your Team's Leaderboard</h2>
        <span>${Math.min(team.length, 5)} / 5</span>
      </div>
      <div class="progress-panel">
        <span>Team's Progress:</span>
        <strong>${progress} pts</strong>
        <img src="${assets.gem}" alt="" />
      </div>
      <div class="leaderboard">
        ${team.map((member, index) => renderMemberRow(member, index + 1)).join("")}
        <button class="send-invite" type="button" data-action="share-team">Send invite <span>+</span></button>
      </div>
    </section>
  `;
}

function renderNetworkTab() {
  return `
    <section class="profile-section">
      <div class="progress-panel compact">
        <span>Networking Points</span>
        <strong>720 pts</strong>
        <img src="${assets.gem}" alt="" />
      </div>
      <div class="section-heading">
        <h2>My Network</h2>
        <span>3 / 5</span>
      </div>
      <div class="list-stack">
        ${defaultTeam.slice(0, 3).map((member) => renderNetworkRow(member, "Following")).join("")}
      </div>
      <div class="section-heading">
        <h2>People You May Know</h2>
        <span>3 / 5</span>
      </div>
      <div class="list-stack">
        ${recommendedPeople.map((person) => renderNetworkRow({ name: person.name, points: 0, avatar: userInitials(person.name), detail: person.detail }, person.status)).join("")}
      </div>
    </section>
  `;
}

function renderWinningsTab() {
  const history = state.history.length ? state.history : [activeDraw()];

  return `
    <section class="profile-section">
      <div class="winnings-summary">
        <div><span>USDT</span><strong>${formatUsdt(state.balances.usdt)}</strong></div>
        <div><span>Points</span><strong>${state.balances.points}</strong></div>
        <div><span>Gems</span><strong>${state.balances.gems}</strong></div>
      </div>
      <div class="section-heading">
        <h2>Rewards Won</h2>
        <span>${state.inventory.length}</span>
      </div>
      <div class="reward-grid">
        ${state.inventory.map(renderInventoryItem).join("")}
      </div>
      <div class="section-heading">
        <h2>Scratch History</h2>
        <span>${history.length}</span>
      </div>
      <div class="list-stack">
        ${history.slice(0, 5).map((draw) => `
          <article class="history-row">
            <span>${escapeHtml(draw.ticket.displayName)}</span>
            <strong>${formatUsdt(draw.reward.usdt)} + ${draw.reward.score} pts</strong>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderGameplayTab() {
  const progress = Math.max(18, Math.min(100, Math.round((state.balances.points / 620) * 100)));

  return `
    <section class="profile-section gameplay-section">
      <h2>Level Up to Unlock Rewards!</h2>
      <div class="level-ring" style="--progress:${progress * 3.6}deg">
        <strong>${progress}%</strong>
        <span>Rookie</span>
      </div>
      <p class="unlock-copy">Requirement: Sign up. Unlocks: access to wiping and profile.</p>
      <h2>How to Earn Points</h2>
      <div class="bubble-board">
        ${gameplayActions.map((action) => `
          <button class="earn-bubble" type="button" data-action="earn-points" data-points="${parseInt(action.points.replace(/[^0-9]/g, ""), 10) || 5}">
            <strong>${escapeHtml(action.points)}</strong>
            <span>${escapeHtml(action.label)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSettingsScreen() {
  const profile = state.profile;

  return renderShell(`
    <section class="settings-screen">
      <div class="settings-top">
        <button type="button" data-action="view-profile">Back</button>
        <h1>Profile Settings</h1>
      </div>
      <form class="settings-form" data-form="settings">
        <div class="avatar-picker" role="radiogroup" aria-label="Choose an assistant avatar">
          ${renderAvatarOption("blue", assets.aiBlue, profile.avatar === "blue")}
          ${renderAvatarOption("green", assets.aiGreen, profile.avatar === "green")}
        </div>
        <label>
          <span>Name</span>
          <input type="text" name="name" value="${escapeHtml(profile.name)}" required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" value="${escapeHtml(profile.email || "user@mail.com")}" required />
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" placeholder="${profile.passwordSet ? "Password saved" : "Create password"}" />
        </label>
        <label>
          <span>Reward focus</span>
          <select name="rewardGoal">
            ${["Cash rewards", "Gems", "Team rewards", "Merch"].map((goal) => `<option ${profile.rewardGoal === goal ? "selected" : ""}>${goal}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Profile tags</span>
          <input type="text" name="interests" value="${escapeHtml(profile.interests.join(", "))}" />
        </label>
        <div class="settings-rewards">
          <h2>Rewards Won</h2>
          <p>${formatUsdt(state.balances.usdt)} USDT, ${state.balances.points} points, ${state.balances.gems} gems</p>
        </div>
        <button class="primary-cta" type="submit">Save Profile</button>
      </form>
    </section>
  `);
}

function renderAvatarOption(value, src, checked) {
  return `
    <label class="avatar-option ${checked ? "is-selected" : ""}">
      <input type="radio" name="avatar" value="${value}" ${checked ? "checked" : ""} />
      <img src="${src}" alt="${value} avatar" />
      <span>${value}</span>
    </label>
  `;
}

function renderAvatarRail() {
  const names = ["Andrew", "Jess", "Jim", "Maya"];
  return `
    <div class="avatar-rail">
      ${names.map((name, index) => `<span class="friend-avatar friend-${index}">${userInitials(name)}</span>`).join("")}
      <span class="friend-avatar add-avatar">+</span>
    </div>
  `;
}

function renderRewardItem(item) {
  const amount = typeof item.amount === "number" ? `<strong>${item.type === "usdt" ? formatUsdt(item.amount) : item.amount}</strong>` : "";
  return `
    <article class="reward-card">
      ${renderRewardIcon(item.icon)}
      <div>
        ${amount}
        <span>${escapeHtml(item.label)}</span>
      </div>
    </article>
  `;
}

function renderInventoryItem(item) {
  const amount = item.type === "usdt" ? formatUsdt(item.amount) : item.amount;
  return `
    <article class="inventory-item">
      ${renderRewardIcon(item.type === "merch" ? "shirt" : item.type === "wildcard" ? "wildcard" : "gem")}
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(amount)} ${escapeHtml(item.unit)}</strong>
    </article>
  `;
}

function renderRewardIcon(icon) {
  if (icon === "wildcard") return `<img class="reward-icon" src="${assets.wildcard}" alt="" />`;
  if (icon === "shirt") return `<img class="reward-icon" src="${assets.tshirt}" alt="" />`;
  if (icon === "usdt") return `<span class="reward-icon text-icon">$</span>`;
  return `<img class="reward-icon" src="${assets.gem}" alt="" />`;
}

function renderMemberRow(member, rank) {
  return `
    <article class="member-row ${member.status === "pending" ? "is-pending" : ""}">
      <span class="rank">${rank}</span>
      <span class="avatar small">${member.avatar || userInitials(member.name)}</span>
      <div>
        <strong>${escapeHtml(member.name)}</strong>
        <span>${member.status === "pending" ? "Pending..." : `Debt: $ ${member.points * 10}`}</span>
      </div>
      <em>${member.status === "pending" ? "Pending..." : `${member.points} pts`}</em>
    </article>
  `;
}

function renderNetworkRow(person, status) {
  return `
    <article class="network-row">
      <span class="avatar small">${person.avatar || userInitials(person.name)}</span>
      <div>
        <strong>${escapeHtml(person.name)}</strong>
        <span>${escapeHtml(person.detail || "Launch teammate")}</span>
      </div>
      <button type="button" data-action="network-follow">${escapeHtml(status)}</button>
    </article>
  `;
}

function afterRender() {
  if (state.step === "scratch") {
    requestAnimationFrame(initScratchCanvas);
  }
}

function initScratchCanvas() {
  const canvas = document.querySelector("#scratch-canvas");
  const stage = document.querySelector("#scratch-stage");
  const draw = state.currentDraw;

  if (!canvas || !stage || !draw) return;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  const rect = stage.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
  const colors = draw.ticket.scratchGradient.match(/#[0-9a-fA-F]{3,6}/g) || ["#7586ff", "#d9f2ff"];
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1] || colors[0]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  for (let index = 0; index < 900; index += 1) {
    const x = randomInt(Math.max(1, Math.round(rect.width)));
    const y = randomInt(Math.max(1, Math.round(rect.height)));
    context.fillRect(x, y, 1, 1);
  }

  context.fillStyle = "rgba(255, 255, 255, 0.88)";
  context.font = "800 22px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(draw.ticket.isGolden ? "Golden Scratch" : "Scratch to reveal", rect.width / 2, rect.height / 2);

  let isDrawing = false;
  let lastPoint = null;
  let complete = false;

  const getPoint = (event) => ({
    x: event.clientX - canvas.getBoundingClientRect().left,
    y: event.clientY - canvas.getBoundingClientRect().top,
  });

  const scratch = (point) => {
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 42;

    if (lastPoint) {
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    }

    context.beginPath();
    context.arc(point.x, point.y, 24, 0, Math.PI * 2);
    context.fill();
    lastPoint = point;
  };

  const progress = () => {
    const sample = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    let total = 0;

    for (let index = 3; index < sample.length; index += 40) {
      if (sample[index] < 12) clear += 1;
      total += 1;
    }

    return total ? clear / total : 0;
  };

  const finish = () => {
    if (complete) return;
    complete = true;
    context.clearRect(0, 0, canvas.width, canvas.height);
    window.setTimeout(() => {
      state.step = "reveal";
      saveState();
      render();
    }, 220);
  };

  canvas.addEventListener("pointerdown", (event) => {
    isDrawing = true;
    lastPoint = getPoint(event);
    scratch(lastPoint);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!isDrawing || complete) return;
    scratch(getPoint(event));
    if (progress() > 0.38) finish();
  });

  canvas.addEventListener("pointerup", () => {
    isDrawing = false;
    lastPoint = null;
  });

  canvas.addEventListener("pointercancel", () => {
    isDrawing = false;
    lastPoint = null;
  });
}

app.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  event.preventDefault();
  const data = new FormData(form);

  if (form.dataset.form === "signup") {
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    state.profile.email = email;
    state.profile.passwordSet = password.length > 0;
    state.profile.name = state.profile.name || email.split("@")[0] || "Jess Wu";
    startScratch();
    return;
  }

  if (form.dataset.form === "settings") {
    const name = String(data.get("name") || "").trim() || "Jess Wu";
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const interests = String(data.get("interests") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);

    state.profile = {
      ...state.profile,
      name,
      email,
      passwordSet: password.length > 0 || state.profile.passwordSet,
      handle: `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "healthyhabits"}`,
      avatar: String(data.get("avatar") || "blue"),
      interests: interests.length ? interests : state.profile.interests,
      rewardGoal: String(data.get("rewardGoal") || "Cash rewards"),
      profileComplete: true,
    };
    state.step = "profile";
    saveState();
    render();
  }
});

app.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.tab) {
    state.profileTab = button.dataset.tab;
    saveState();
    render();
    return;
  }

  switch (button.dataset.action) {
    case "focus-signup":
      app.querySelector("input[name='email']")?.focus();
      break;
    case "force-reveal":
      state.step = "reveal";
      saveState();
      render();
      break;
    case "activate-rewards":
      state.step = "team";
      saveState();
      render();
      break;
    case "share-team":
      state.teamCount = Math.min(5, state.teamCount + 1);
      state.balances.points += 10;
      saveState();
      render();
      break;
    case "view-profile":
      state.step = "profile";
      saveState();
      render();
      break;
    case "open-settings":
      state.step = "settings";
      saveState();
      render();
      break;
    case "new-scratch":
      startScratch();
      break;
    case "earn-points":
      state.balances.points += Number(button.dataset.points || 5);
      saveState();
      render();
      break;
    case "show-odds":
      window.alert("Weighted draw: Blue 45%, Aqua 30%, Green 18%, Pink 6.5%, Golden 0.5%. Common tickets pay less; rare and golden tickets pay more.");
      break;
    case "network-follow":
      button.textContent = "Following";
      button.disabled = true;
      state.balances.points += 2;
      saveState();
      break;
    default:
      break;
  }
});

render();
