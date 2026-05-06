class InspiredDashboardPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._clock = '';
    this._timer = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  connectedCallback() {
    this._updateClock();
    this._timer = setInterval(() => {
      this._updateClock();
      const clock = this.shadowRoot?.getElementById('clock');
      if (clock) clock.textContent = this._clock;
    }, 1000);
    this._render();
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
  }

  _updateClock() {
    const now = new Date();
    this._clock = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    this._dateLine = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
  }

  _state(entityId, fallback = '—') {
    return this._hass?.states?.[entityId]?.state ?? fallback;
  }

  _attr(entityId, attr, fallback = '—') {
    return this._hass?.states?.[entityId]?.attributes?.[attr] ?? fallback;
  }

  _friendly(entityId, fallback = 'Unbekannt') {
    return this._attr(entityId, 'friendly_name', fallback);
  }

  _isOn(entityId) {
    return ['on', 'playing', 'home', 'open', 'unlocked', 'cleaning'].includes(this._state(entityId));
  }

  _toggle(entityId) {
    if (!this._hass || !entityId) return;
    const domain = entityId.split('.')[0];
    const state = this._state(entityId);
    if (domain === 'light' || domain === 'switch' || domain === 'input_boolean') {
      this._hass.callService(domain, state === 'on' ? 'turn_off' : 'turn_on', { entity_id: entityId });
    } else if (domain === 'cover') {
      this._hass.callService('cover', state === 'open' ? 'close_cover' : 'open_cover', { entity_id: entityId });
    } else if (domain === 'vacuum') {
      this._hass.callService('vacuum', state === 'cleaning' ? 'pause' : 'start', { entity_id: entityId });
    } else if (domain === 'media_player') {
      this._hass.callService('media_player', 'media_play_pause', { entity_id: entityId });
    }
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _call(domain, service, data = {}) {
    this._hass?.callService(domain, service, data);
  }

  _styles() {
    return `
      :host {
        --bg: #070b18;
        --panel: rgba(15, 18, 31, 0.82);
        --panel-soft: rgba(18, 22, 38, 0.68);
        --border: rgba(255,255,255,0.07);
        --text: #f7f8ff;
        --muted: #8d91ab;
        --pink: #ff2d6f;
        --violet: #8b5cf6;
        --blue: #3b82f6;
        --cyan: #00d4ff;
        --green: #21d07a;
        --amber: #ffb020;
        --shadow: 0 24px 70px rgba(0,0,0,0.45);
        display: block;
        min-height: 100vh;
        color: var(--text);
      }

      * { box-sizing: border-box; }

      .page {
        min-height: 100vh;
        padding: 26px;
        font-family: Inter, Roboto, system-ui, sans-serif;
        background:
          radial-gradient(circle at 10% 10%, rgba(78, 35, 255, 0.09), transparent 24%),
          radial-gradient(circle at 85% 15%, rgba(255, 45, 111, 0.08), transparent 22%),
          radial-gradient(circle at 50% 100%, rgba(0, 212, 255, 0.05), transparent 25%),
          linear-gradient(180deg, #050814 0%, #070b18 100%);
        position: relative;
        overflow: hidden;
      }

      .page::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
          radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
        background-size: 26px 26px, 38px 38px;
        background-position: 0 0, 13px 13px;
        opacity: 0.45;
        pointer-events: none;
      }

      .shell {
        position: relative;
        z-index: 1;
        max-width: 1680px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }

      .top {
        display: grid;
        grid-template-columns: 1.2fr repeat(4, minmax(150px, 180px));
        gap: 14px;
        align-items: start;
      }

      .clock {
        padding: 8px 4px 14px;
      }

      .clock-time {
        font-size: clamp(48px, 5vw, 70px);
        line-height: 0.9;
        font-weight: 800;
        letter-spacing: -0.06em;
      }

      .clock-sub {
        margin-top: 10px;
        color: var(--muted);
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .clock-greet {
        margin-top: 6px;
        color: #c9ccdd;
        font-size: 18px;
      }

      .pill {
        min-height: 74px;
        padding: 14px 18px;
        border-radius: 999px;
        background: rgba(15,18,31,0.78);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        box-shadow: 0 0 12px currentColor;
      }

      .pill .label {
        color: var(--muted);
        font-size: 12px;
      }

      .pill .value {
        font-size: 27px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }

      .grid-main {
        display: grid;
        grid-template-columns: 2.2fr 1.1fr 1.1fr 1.1fr;
        gap: 16px;
      }

      .card {
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        border-radius: 28px;
        overflow: hidden;
        position: relative;
      }

      .card-inner { padding: 20px; }

      .section-head {
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        margin-bottom: 14px;
      }

      .media-card {
        min-height: 260px;
        background:
          radial-gradient(circle at 15% 30%, rgba(255,45,111,0.22), transparent 45%),
          radial-gradient(circle at 75% 0%, rgba(139,92,246,0.16), transparent 40%),
          linear-gradient(180deg, rgba(39,13,31,0.92), rgba(22,10,20,0.92));
      }

      .media-content {
        display: grid;
        grid-template-rows: auto auto auto 1fr auto;
        height: 100%;
      }

      .media-title {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.05em;
        line-height: 1.05;
        margin: 6px 0 0;
      }

      .media-sub {
        margin-top: 8px;
        color: #d4a8b9;
        font-size: 16px;
      }

      .media-zone {
        margin-top: 10px;
        color: #ff789d;
        font-size: 15px;
      }

      .media-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 26px;
      }

      .round-btn {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        border: 0;
        background: rgba(255,255,255,0.1);
        color: white;
        display: grid;
        place-items: center;
        cursor: pointer;
      }

      .round-btn.primary {
        width: 58px;
        height: 58px;
        background: var(--pink);
        box-shadow: 0 0 30px rgba(255,45,111,0.35);
      }

      .progress {
        margin-top: 26px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 14px;
        align-items: center;
      }

      .progress-bar {
        height: 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        overflow: hidden;
      }

      .progress-bar > div {
        height: 100%;
        width: var(--progress, 42%);
        background: linear-gradient(90deg, #ff2d6f, #ff4b84);
      }

      .status-list {
        display: grid;
        gap: 10px;
      }

      .status-item {
        min-height: 46px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255,255,255,0.055);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .status-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .status-value.ok { color: var(--green); }
      .status-value.warn { color: #ff5c73; }
      .status-value.neutral { color: #c3c8df; }

      .climate-wrap {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 18px;
        align-items: center;
      }

      .ring {
        width: 102px;
        height: 102px;
        border-radius: 50%;
        background: conic-gradient(var(--violet) 0 72%, rgba(255,255,255,0.08) 72% 100%);
        display: grid;
        place-items: center;
      }

      .ring-inner {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        background: #111525;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 26px;
      }

      .climate-info .mode {
        color: #fda55d;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .dual-btns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 16px;
      }

      .action-btn {
        height: 48px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(139,92,246,0.18);
        color: white;
        cursor: pointer;
        font-size: 24px;
      }

      .network-stat {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 18px;
        align-items: center;
      }

      .mini-ring {
        width: 94px;
        height: 94px;
        border-radius: 50%;
        background: conic-gradient(var(--blue) 0 45%, rgba(255,255,255,0.08) 45% 100%);
        display: grid;
        place-items: center;
      }

      .mini-ring .ring-inner {
        width: 66px;
        height: 66px;
        font-size: 18px;
        text-align: center;
        line-height: 1.05;
      }

      .running {
        margin-top: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(33,208,122,0.12);
        color: #8bf0bb;
      }

      .section-label {
        color: var(--muted);
        font-size: 13px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        margin: 8px 2px 0;
      }

      .rooms-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 14px;
      }

      .room-card {
        min-height: 170px;
        padding: 18px;
        border-radius: 24px;
        background: var(--panel-soft);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        position: relative;
        overflow: hidden;
        cursor: pointer;
      }

      .room-card::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 18% 20%, var(--glow, rgba(59,130,246,0.22)), transparent 28%),
          radial-gradient(circle at 85% 85%, var(--glow2, rgba(255,45,111,0.08)), transparent 25%);
        pointer-events: none;
      }

      .room-icon {
        position: relative;
        z-index: 1;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: rgba(255,255,255,0.06);
        display: grid;
        place-items: center;
        font-size: 22px;
      }

      .room-name {
        position: relative;
        z-index: 1;
        margin-top: 34px;
        font-size: 18px;
        font-weight: 700;
      }

      .room-meta {
        position: relative;
        z-index: 1;
        margin-top: 6px;
        color: var(--muted);
        font-size: 14px;
      }

      .room-state {
        position: absolute;
        left: 18px;
        right: 18px;
        bottom: 16px;
        z-index: 1;
        font-size: 15px;
        font-weight: 700;
      }

      .state-on { color: var(--amber); }
      .state-play { color: var(--green); }
      .state-heat { color: #b689ff; }
      .state-alert { color: #ff5e79; }
      .state-off { color: #b8bed6; }

      .vac-grid, .env-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
      }

      .vac-card, .env-card {
        min-height: 122px;
        padding: 16px 18px;
        border-radius: 24px;
        background: var(--panel-soft);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
      }

      .vac-layout {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 14px;
        align-items: center;
        height: 100%;
      }

      .vac-ring {
        width: 74px;
        height: 74px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: conic-gradient(var(--ring, var(--cyan)) 0 calc(var(--pct, 70) * 1%), rgba(255,255,255,0.08) calc(var(--pct, 70) * 1%) 100%);
      }

      .vac-ring .ring-inner {
        width: 56px;
        height: 56px;
        font-size: 20px;
      }

      .vac-title {
        font-size: 18px;
        font-weight: 700;
      }

      .vac-state {
        margin-top: 4px;
        font-weight: 700;
      }

      .vac-progress {
        margin-top: 10px;
        width: 72px;
        height: 6px;
        border-radius: 999px;
        background: rgba(255,255,255,0.1);
        overflow: hidden;
      }

      .vac-progress > div {
        height: 100%;
        width: var(--w, 60%);
        background: var(--ring, var(--cyan));
      }

      .stack-btns {
        display: grid;
        gap: 10px;
      }

      .stack-btns button {
        min-width: 82px;
        height: 38px;
        border-radius: 12px;
        border: 0;
        background: rgba(255,255,255,0.06);
        color: white;
        cursor: pointer;
      }

      .stack-btns .primary {
        background: #3b82f6;
      }

      .env-value {
        font-size: 44px;
        font-weight: 800;
        letter-spacing: -0.06em;
        margin-top: 12px;
      }

      .env-type {
        margin-top: 8px;
        color: var(--muted);
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }

      .env-sub {
        margin-top: 4px;
        color: #8f96b2;
        font-size: 14px;
      }

      .env-line {
        margin-top: 16px;
        height: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        overflow: hidden;
      }

      .env-line > div {
        height: 100%;
        width: 46%;
        background: var(--line, var(--amber));
      }

      .nav {
        display: flex;
        justify-content: center;
        gap: 34px;
        padding: 8px 0 4px;
      }

      .nav-item {
        display: grid;
        justify-items: center;
        gap: 10px;
        color: #9aa1bd;
        font-size: 13px;
        cursor: pointer;
      }

      .nav-icon {
        width: 62px;
        height: 62px;
        border-radius: 18px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.05);
        display: grid;
        place-items: center;
        font-size: 22px;
        position: relative;
      }

      .nav-item.active .nav-icon {
        background: rgba(255,255,255,0.08);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
      }

      .nav-item.active .nav-label { color: white; }

      .nav-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--nav, var(--amber));
        box-shadow: 0 0 12px var(--nav, var(--amber));
      }

      @media (max-width: 1450px) {
        .top { grid-template-columns: 1fr 1fr 1fr; }
        .grid-main { grid-template-columns: 1fr 1fr; }
        .rooms-grid { grid-template-columns: repeat(3, 1fr); }
        .vac-grid, .env-grid { grid-template-columns: repeat(2, 1fr); }
      }

      @media (max-width: 860px) {
        .page { padding: 14px; }
        .top, .grid-main, .rooms-grid, .vac-grid, .env-grid { grid-template-columns: 1fr; }
        .nav { gap: 14px; flex-wrap: wrap; }
      }
    `;
  }

  _render() {
    const c = this._config;

    const media = c.media_player || 'media_player.apple_tv_wohnzimmer';
    const security = c.security || [
      { name: 'Haustür', entity: c.front_door || 'binary_sensor.haustur', icon: '🔒' },
      { name: 'Türkontakt', entity: c.door_contact || 'binary_sensor.eingangstur_offnung', icon: '🚪' },
      { name: 'Garagentor', entity: c.garage_door || 'binary_sensor.garagentor', icon: '🚗' },
      { name: 'Bewegung', entity: c.motion || 'binary_sensor.flur_bewegung', icon: '🔴' },
    ];

    const rooms = c.rooms || [
      { name: 'Wohnzimmer', icon: '🛋️', entity: c.room_living || 'light.wohnzimmer', meta: 'Sonos · Lampe · TV', stateLabel: '1 Licht an', color: 'rgba(255,176,32,0.24)', line: 'state-on' },
      { name: 'Küche', icon: '🍽️', entity: c.room_kitchen || 'media_player.kueche', meta: 'LIFX · Sonos · TV', stateLabel: 'Playing music', color: 'rgba(0,212,255,0.18)', line: 'state-play' },
      { name: 'Schlafzimmer', icon: '🛏️', entity: c.room_bedroom || 'climate.schlafzimmer', meta: 'Thermostat · Sensor', stateLabel: 'Heat · 22°', color: 'rgba(139,92,246,0.22)', line: 'state-heat' },
      { name: 'Wintergarten', icon: '🌿', entity: c.room_conservatory || 'light.wintergarten', meta: '6 Lichter · Sonos', stateLabel: 'Alles aus', color: 'rgba(34,197,94,0.18)', line: 'state-off' },
      { name: 'Flur', icon: '🧍', entity: c.room_hall || 'light.flur', meta: 'Sensoren · Lampen', stateLabel: 'Lichter an', color: 'rgba(255,136,0,0.18)', line: 'state-on' },
      { name: 'Eingang', icon: '🚪', entity: c.room_entry || 'binary_sensor.eingangstur_offnung', meta: 'Türschloss · Motion', stateLabel: 'Bewegung!', color: 'rgba(255,45,111,0.18)', line: 'state-alert' },
      { name: 'Garage', icon: '🏠', entity: c.room_garage || 'binary_sensor.garage', meta: 'Türen · Sensoren', stateLabel: 'Alles geschlossen', color: 'rgba(59,130,246,0.12)', line: 'state-off' },
      { name: 'Außen', icon: '🌳', entity: c.room_outside || 'light.aussen', meta: 'Driveway · Porch', stateLabel: 'Lichter an', color: 'rgba(34,197,94,0.18)', line: 'state-play' },
      { name: 'Office', icon: '💼', entity: c.room_office || 'switch.office', meta: 'TV · Shelly', stateLabel: 'Standby', color: 'rgba(59,130,246,0.14)', line: 'state-off' },
      { name: 'Study', icon: '📚', entity: c.room_study || 'vacuum.robovac_g30', meta: 'RoboVac G30', stateLabel: 'Docked', color: 'rgba(139,92,246,0.12)', line: 'state-off' },
      { name: 'Keller', icon: '🏚️', entity: c.room_basement || 'sensor.keller_temperatur', meta: 'Shelly · Pi-hole', stateLabel: 'Monitoring', color: 'rgba(255,176,32,0.12)', line: 'state-off' },
      { name: 'Media', icon: '🎵', entity: media, meta: 'Sonos · TV · Cast', stateLabel: '1 aktiv', color: 'rgba(255,45,111,0.16)', line: 'state-alert' },
    ];

    const vacuums = c.vacuums || [
      { name: 'RoboVac G30', entity: c.vacuum_1 || 'vacuum.robovac_g30', pct: 78, ring: '#21d07a' },
      { name: 'RoboVac', entity: c.vacuum_2 || 'vacuum.robovac', pct: 100, ring: '#3b82f6' },
      { name: 'RoboVac X8', entity: c.vacuum_3 || 'vacuum.robovac_x8', pct: 55, ring: '#ffb020' },
      { name: 'RoboVac L70', entity: c.vacuum_4 || 'vacuum.robovac_l70', pct: 42, ring: '#a78bfa' },
    ];

    const env = c.environment || [
      { value: this._state(c.temp1 || 'sensor.basement_temperature', '64.4'), type: 'Temperature', sub: 'Basement / ERG', line: '#ffb020', icon: '🌡️' },
      { value: this._state(c.hum1 || 'sensor.basement_humidity', '27'), type: 'Humidity', sub: 'Basement / ERG', line: '#00d4ff', icon: '💧' },
      { value: this._state(c.temp2 || 'sensor.kitchen_temperature', '70.9'), type: 'Temperature', sub: 'Küche', line: '#ff8a00', icon: '🌡️' },
      { value: this._state(c.hum2 || 'sensor.kitchen_humidity', '25.3'), type: 'Humidity', sub: 'Küche', line: '#00d4ff', icon: '💧' },
      { value: this._state(c.temp3 || 'sensor.office_temperature', '73.6'), type: 'Temperature', sub: 'Office', line: '#ffb020', icon: '🌡️' },
      { value: this._state(c.hum3 || 'sensor.office_humidity', '24.1'), type: 'Humidity', sub: 'Office', line: '#00d4ff', icon: '💧' },
    ];

    const mediaTitle = this._attr(media, 'media_title', 'Nothing playing');
    const mediaArtist = this._attr(media, 'media_artist', this._attr(media, 'app_name', 'Bereit'));
    const mediaPosition = Number(this._attr(media, 'media_position', 0)) || 0;
    const mediaDuration = Number(this._attr(media, 'media_duration', 1)) || 1;
    const mediaProgress = `${Math.min(100, Math.max(0, (mediaPosition / mediaDuration) * 100))}%`;
    const weatherEntity = c.weather || 'weather.home';
    const weatherTemp = this._attr(weatherEntity, 'temperature', '21');
    const pihole = c.pihole || 'sensor.pihole_ads_percentage_blocked_today';
    const cpu = c.cpu || 'sensor.cpu_usage';
    const devices = c.devices || 'sensor.devices_online';
    const climate = c.climate || 'climate.schlafzimmer';
    const setTemp = this._attr(climate, 'temperature', 22);
    const actualTemp = this._attr(climate, 'current_temperature', 22);
    const mode = this._state(climate, 'heat');

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <div class="page">
        <div class="shell">
          <div class="top">
            <div class="clock">
              <div class="clock-time" id="clock">${this._clock}</div>
              <div class="clock-sub">${String(this._dateLine || '').toUpperCase()}</div>
              <div class="clock-greet">Guten Abend, ${c.username || 'Alex'}</div>
            </div>

            <div class="pill">
              <div style="font-size:22px;">⛅</div>
              <div>
                <div class="value">${weatherTemp}°C</div>
                <div class="label">${this._state(weatherEntity, 'Teilweise bewölkt')}</div>
              </div>
            </div>

            <div class="pill">
              <div class="dot" style="color:#21d07a;background:#21d07a"></div>
              <div>
                <div class="label">Pi-hole</div>
                <div class="value">${this._state(pihole, '4.48')}%</div>
              </div>
            </div>

            <div class="pill">
              <div class="dot" style="color:#3b82f6;background:#3b82f6"></div>
              <div>
                <div class="label">CPU</div>
                <div class="value">${this._state(cpu, '12')}%</div>
              </div>
            </div>

            <div class="pill">
              <div class="dot" style="color:#8b5cf6;background:#8b5cf6"></div>
              <div>
                <div class="label">Devices</div>
                <div class="value">${this._state(devices, '24')}</div>
              </div>
            </div>
          </div>

          <div class="grid-main">
            <section class="card media-card" data-moreinfo="${media}">
              <div class="card-inner media-content">
                <div class="section-head">Now Playing · ${this._friendly(media, 'Kitchen Sonos')}</div>
                <div class="media-title">${mediaTitle}</div>
                <div class="media-sub">${mediaArtist}</div>
                <div class="media-zone">⌘ ${this._friendly(media, 'Zone')} · ${this._attr(media, 'volume_level', '0.62')}</div>
                <div>
                  <div class="media-controls">
                    <button class="round-btn" data-media="prev">⏮</button>
                    <button class="round-btn primary" data-media="playpause">⏯</button>
                    <button class="round-btn" data-media="next">⏭</button>
                  </div>
                  <div class="progress">
                    <div class="progress-bar" style="--progress:${mediaProgress}"><div></div></div>
                    <div style="color:#a8adc4">${Math.floor(mediaDuration / 60)}:${String(Math.floor(mediaDuration % 60)).padStart(2, '0')}</div>
                  </div>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-inner">
                <div class="section-head">Security</div>
                <div class="status-list">
                  ${security.map(item => {
                    const state = this._state(item.entity, '—');
                    const ok = ['off', 'closed', 'locked', 'armed_away', 'armed_home'].includes(state);
                    return `<div class="status-item" data-moreinfo="${item.entity}">
                      <div class="status-name"><span>${item.icon}</span><span>${item.name}</span></div>
                      <div class="status-value ${ok ? 'ok' : 'warn'}">${state}</div>
                    </div>`;
                  }).join('')}
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-inner">
                <div class="section-head">Bedroom Climate</div>
                <div class="climate-wrap">
                  <div class="ring"><div class="ring-inner">${actualTemp}°</div></div>
                  <div class="climate-info">
                    <div class="mode">🔥 ${mode.toUpperCase()}</div>
                    <div style="color:#bfc4dc">Set: ${setTemp}°</div>
                    <div style="color:#8f96b2;margin-top:6px;">Actual: ${actualTemp}°</div>
                  </div>
                </div>
                <div class="dual-btns">
                  <button class="action-btn" data-climate="down">−</button>
                  <button class="action-btn" data-climate="up">+</button>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-inner">
                <div class="section-head">Pi-hole Network</div>
                <div class="network-stat">
                  <div class="mini-ring"><div class="ring-inner">${this._state(pihole, '4.5')}%<br><span style="font-size:11px;color:#94a0c0">blocked</span></div></div>
                  <div>
                    <div style="display:grid;gap:8px;color:#cdd2e8;">
                      <div>Queries: <strong>${this._state(c.queries || 'sensor.pihole_dns_queries_today', '250916')}</strong></div>
                      <div>Blocked: <strong>${this._state(c.blocked || 'sensor.pihole_ads_blocked_today', '11231')}</strong></div>
                      <div>Clients: <strong>${this._state(c.clients || 'sensor.pihole_clients_ever_seen', '157')}</strong></div>
                    </div>
                    <div class="running"><span class="dot" style="color:#21d07a;background:#21d07a"></span>Running</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div class="section-label">Rooms</div>
          <div class="rooms-grid">
            ${rooms.map((room) => `
              <div class="room-card" data-toggle="${room.entity}" style="--glow:${room.color};--glow2:${room.color};">
                <div class="room-icon">${room.icon}</div>
                <div class="room-name">${room.name}</div>
                <div class="room-meta">${room.meta}</div>
                <div class="room-state ${room.line}">${room.stateLabel}</div>
              </div>
            `).join('')}
          </div>

          <div class="section-label">Vacuums</div>
          <div class="vac-grid">
            ${vacuums.map((vac, index) => {
              const state = this._state(vac.entity, index === 0 ? 'cleaning' : 'docked');
              const primary = state === 'cleaning' ? 'Pause' : 'Start';
              return `
                <div class="vac-card">
                  <div class="vac-layout">
                    <div class="vac-ring" style="--pct:${vac.pct};--ring:${vac.ring}"><div class="ring-inner">🤖</div></div>
                    <div>
                      <div class="vac-title">${vac.name}</div>
                      <div class="vac-state" style="color:${vac.ring}">● ${state}</div>
                      <div class="vac-progress" style="--ring:${vac.ring};--w:${vac.pct}%"><div></div></div>
                    </div>
                    <div class="stack-btns">
                      <button class="primary" data-vacuum="toggle" data-entity="${vac.entity}">${primary}</button>
                      <button data-vacuum="base" data-entity="${vac.entity}">Dock</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="section-label">Environment</div>
          <div class="env-grid">
            ${env.map((item) => `
              <div class="env-card">
                <div>${item.icon}</div>
                <div class="env-value">${item.value}${item.type === 'Humidity' ? '%' : '°'}</div>
                <div class="env-type">${item.type}</div>
                <div class="env-sub">${item.sub}</div>
                <div class="env-line" style="--line:${item.line}"><div></div></div>
              </div>
            `).join('')}
          </div>

          <div class="nav">
            ${[
              ['Overview','🏠','#ffb020',true],
              ['Kitchen','🍽️','#21d07a'],
              ['Living','🛋️','#ffb020'],
              ['Bedroom','🛏️','#8b5cf6'],
              ['Conservatory','🌿','#00d4ff'],
              ['Entry','🚪','#ff2d6f'],
              ['Garage','🚗','#ff8a00'],
              ['Office','💼','#3b82f6'],
              ['Media','🎵','#ff2d6f']
            ].map(([label,icon,color,active]) => `
              <div class="nav-item ${active ? 'active' : ''}" style="--nav:${color}">
                <div class="nav-icon">${icon}</div>
                <div class="nav-label">${label}</div>
                <div class="nav-dot"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('[data-moreinfo]').forEach(el => {
      el.addEventListener('click', () => this._moreInfo(el.dataset.moreinfo));
    });

    this.shadowRoot.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', () => this._toggle(el.dataset.toggle));
    });

    this.shadowRoot.querySelectorAll('[data-media]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.media;
        if (action === 'prev') this._call('media_player', 'media_previous_track', { entity_id: media });
        if (action === 'playpause') this._call('media_player', 'media_play_pause', { entity_id: media });
        if (action === 'next') this._call('media_player', 'media_next_track', { entity_id: media });
      });
    });

    this.shadowRoot.querySelectorAll('[data-climate]').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = Number(this._attr(climate, 'temperature', 22)) || 22;
        const next = btn.dataset.climate === 'up' ? current + 1 : current - 1;
        this._call('climate', 'set_temperature', { entity_id: climate, temperature: next });
      });
    });

    this.shadowRoot.querySelectorAll('[data-vacuum]').forEach(btn => {
      btn.addEventListener('click', () => {
        const entity = btn.dataset.entity;
        if (btn.dataset.vacuum === 'toggle') this._toggle(entity);
        if (btn.dataset.vacuum === 'base') this._call('vacuum', 'return_to_base', { entity_id: entity });
      });
    });
  }
}

customElements.define('inspired-dashboard-panel', InspiredDashboardPanel);
