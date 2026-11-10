// =============================================================================
// ⚙️  BOOT SEQUENCE CONFIG — edit these to customise the boot screen
// =============================================================================
const BOOT_HOSTNAME = 'tv.pirtatemedia.eliotstocker'; // shown in boot log + terminal prompt

const BOOT_LINES = [
    '[  0.000000] BIOS-e820: [mem 0x000000000 - 0x0009efff] usable',
    '[  0.000001] kernel: initialising engineering leader subsystem...',
    '[  0.120304] net: eth0: link up 1000Mbps full duplex',
    '[  0.340012] fs: mounting ext4 /home — OK',
    '[  0.512043] snd: audio driver loaded — PCM 48kHz stereo',
    '[  0.621009] drm: framebuffer device registered',
    '[  0.880221] systemd: started session manager',
    '[  1.001032] udev: hardware events daemon ready',
    '[  1.210045] boot: loading user profile /home/.profile...',
    '[  1.445001] auth: identity confirmed — engineering leader',
    '[  1.700234] net: established tunnel to piratemedia.tv',
    '[  2.001456] boot: all subsystems nominal',
];
// =============================================================================

// ---------------------------------------------------------------------------
// Boot Animation (Three.js 486 PC)
// ---------------------------------------------------------------------------
const BOOT_DURATION = 5000; // ms total animation time
const BOOT_FPS = 15;        // render cap — keeps CPU light

function startBootAnimation() {
    const container = document.getElementById('boot-container');

    // Off-screen canvas that feeds the 3D monitor texture
    // Canvas must match the PlaneGeometry(3.6, 2.7) aspect ratio (4:3) so the
    // texture is not stretched when mapped onto the screen plane.
    const SCREEN_ASPECT = 3.6 / 2.7; // 4:3 — matches PlaneGeometry(3.6, 2.7)
    const screenHeight = window.innerHeight;
    const actualScreenWidth = window.innerWidth;
    const screenWidth  = Math.round(screenHeight * SCREEN_ASPECT);
    const screenStart = Math.round((actualScreenWidth - screenWidth) / 2);
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width  = screenWidth;
    screenCanvas.height = screenHeight;
    const ctx2d = screenCanvas.getContext('2d');
    ctx2d.imageSmoothingEnabled = true;

    // --- Three.js scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const FOV = 60;
    const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Post-processing pass: chromatic aberration within the 3D scene
    const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth  * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio
    );
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postScene  = new THREE.Scene();
    const postMaterial = new THREE.ShaderMaterial({
        uniforms: {
            tDiffuse: { value: renderTarget.texture },
            rOffset:  { value: new THREE.Vector2(0, 0) },
            gOffset:  { value: new THREE.Vector2(0, 0) },
            bOffset:  { value: new THREE.Vector2(0, 0) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 rOffset, gOffset, bOffset;
            varying vec2 vUv;
            void main() {
                vec4 cr = texture2D(tDiffuse, vUv + rOffset);
                vec4 cg = texture2D(tDiffuse, vUv + gOffset);
                vec4 cb = texture2D(tDiffuse, vUv + bOffset);
                gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
            }
        `
    });
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
    dirLight.position.set(6, 12, 6);
    scene.add(dirLight);
    const screenLight = new THREE.PointLight(0x4da6ff, 0, 8);
    screenLight.position.set(0, 3.3, 2.5);
    scene.add(screenLight);

    // 486 PC geometry
    const computerGroup = new THREE.Group();
    scene.add(computerGroup);
    const beigeMat = new THREE.MeshLambertMaterial({ color: 0xc8c3b5 });
    const darkMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    function addBox(w, h, d, x, y, z, mat) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        computerGroup.add(m);
        return m;
    }
    addBox(5.2,  1.4,  5.0,  0,    0.7,  0,    beigeMat); // case
    addBox(1.6,  0.25, 0.1,  1.2,  0.9,  2.51, darkMat);  // drive bay
    addBox(4.4,  3.6,  4.2,  0,    3.3, -0.1,  beigeMat); // monitor body
    addBox(4.0,  3.2,  0.2,  0,    3.3,  2.0,  darkMat);  // bezel
    addBox(3.8,  0.2,  1.4,  0,    0.1,  4.8,  beigeMat); // keyboard
    addBox(3.5,  0.05, 1.1,  0,    0.2,  4.8,  darkMat);  // keys
    addBox(0.45, 0.2,  0.7,  2.6,  0.1,  4.8,  beigeMat); // mouse
    addBox(0.04, 0.04, 2.0,  2.6,  0.02, 3.6,  darkMat);  // cord

    // Monitor screen plane
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter     = THREE.LinearFilter;
    screenTexture.magFilter     = THREE.LinearFilter;
    screenTexture.generateMipmaps = false;
    screenTexture.anisotropy    = renderer.capabilities.getMaxAnisotropy();
    const SCREEN_Z   = 2.11;
    const screenPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 2.7),
        new THREE.MeshBasicMaterial({ map: screenTexture })
    );
    screenPlane.position.set(0, 3.3, SCREEN_Z);
    computerGroup.add(screenPlane);

    // Render the 2D content onto the screen texture each frame
    const TEX_SCALE = 1.5;
    const TEX_FONT  = 10 * TEX_SCALE;
    const TEX_LH    = 14 * TEX_SCALE;
    const TEX_PAD   = 40 * TEX_SCALE;

    // Loading state — driven externally via the control methods returned below
    const QUICK_BOOT_DURATION = 1000; // ms to scroll through all boot messages
    const MIN_LOGO_DURATION   = 3500; // ms logo/loading bar is shown for at minimum
    let scriptLoadProgress = 0;       // 0–1, display value (creeps + snaps)
    let scriptLoadTarget   = 0;       // real value set by notifyLoadProgress
    let lastCreepTime      = 0;       // tracks 500 ms creep interval
    let scriptsLoaded      = false;   // flipped once all three scripts are ready
    let bootLogActive      = false;   // true once the quick boot log phase starts
    let bootLogStartTime   = null;    // RAF timestamp when boot log began
    let bootLogDone        = false;   // true once boot log animation finishes

    const asciiLogo = [
            "┌── ╷   ╷ ╭─╮ ─┬─ █▀▀ ▀█▀ █▀▀█ █▀▀ █ █ █▀▀ █▀▀█",
            "├─  │   │ │ │  │  ▀▀█  █  █  █ █   █▀▄ █▀▀ █▄▄▀",
            "└── └─  ╵ ╰─╯  ╵  ▄▄█  █  █▄▄█ █▄▄ █ █ █▄▄ █  █"
    ];

    function renderScreenTexture(time = null) {
        ctx2d.fillStyle = '#000000';
        ctx2d.fillRect(0, 0, screenWidth, screenHeight);
        ctx2d.textBaseline = 'top';

        if (!bootLogActive) {
            // ── Logo + loading bar ──────────────────────────────────────────
            ctx2d.textAlign = 'center';
            ctx2d.fillStyle = '#00c0ff';
            ctx2d.font = `${Math.floor(actualScreenWidth / 50)}px "Roboto Mono", monospace`;
            for (let i = 0; i < asciiLogo.length; i++) {
                ctx2d.fillText(asciiLogo[i], (actualScreenWidth / 2) - screenStart, screenHeight / 2 - 50 + i * 14);
            }

            // Progress bar
            const barW = Math.floor(actualScreenWidth * 0.55);
            const barH = 24;
            const barX = Math.floor((actualScreenWidth - barW) / 2) - screenStart;
            const barY = Math.floor(screenHeight / 2 + 100);
            ctx2d.strokeStyle = '#00c0ff';
            ctx2d.lineWidth = 3;
            ctx2d.strokeRect(barX, barY, barW, barH);
            if (scriptLoadProgress > 0) {
                ctx2d.fillStyle = '#00c0ff';
                ctx2d.fillRect(barX + 3, barY + 3, Math.floor((barW - 6) * scriptLoadProgress), barH - 6);
            }
            ctx2d.font = `20px "Roboto Mono", monospace`;
            ctx2d.fillStyle = '#000000';
            ctx2d.fillText(`${Math.round(scriptLoadProgress * 100)}%`, barX + 20, barY + 4);

            screenLight.color.setHex(0x4da6ff);
            screenLight.intensity = 0.8 + Math.random() * 0.2;
        } else {
            // ── Quick boot log / prompt ─────────────────────────────────────
            ctx2d.fillStyle = '#ffffff';
            ctx2d.textAlign = 'left';
            ctx2d.font = `${actualScreenWidth < 600 ? 8 : 10}px "Roboto Mono", monospace`;

            const bootElapsed = (time !== null && bootLogStartTime !== null)
                ? time - bootLogStartTime : 0;
            const bootProg = Math.min(bootElapsed / QUICK_BOOT_DURATION, 1.0);

            if (bootProg < 1.0) {
                const count    = Math.ceil(bootProg * BOOT_LINES.length);
                const visible  = BOOT_LINES.slice(0, count);
                const startIdx = Math.max(0, visible.length - 40);
                for (let i = startIdx; i < visible.length; i++) {
                    ctx2d.fillText(visible[i], TEX_PAD - screenStart, TEX_PAD + (i - startIdx) * TEX_LH);
                }
            }

            screenLight.color.setHex(0xffffff);
            screenLight.intensity = 0.6 + Math.random() * 0.3;
        }
        screenTexture.needsUpdate = true;
    }

    // Camera zoom alignment targets
    let FINAL_Z, finalCameraX, finalCameraY;
    function updateCameraTargets() {
        const halfFovRad = (FOV / 2) * (Math.PI / 180);
        // Distance at which the screen plane (2.7 units tall) fills the viewport height exactly
        FINAL_Z      = SCREEN_Z + (2.7 / 2) / Math.tan(halfFovRad);
        finalCameraX = 0;
        finalCameraY = 3.3; // centre of screen plane
    }

    // Initial frame — visible immediately before animation starts
    updateCameraTargets();
    camera.position.set(Math.sin(Math.PI / 2) * 11.5, 4.5, Math.cos(Math.PI / 2) * 11.5 + SCREEN_Z);
    camera.lookAt(0, 3.3, SCREEN_Z);
    postMaterial.uniforms.rOffset.value.set( 3.0 / window.innerWidth, 0);
    postMaterial.uniforms.bOffset.value.set(-3.0 / window.innerWidth, 0);
    renderScreenTexture();
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);

    // Animation loop
    let startTime = null;
    let running   = true;
    const frameInterval = 1000 / BOOT_FPS;
    let lastRenderTime  = 0;

    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    function bootFrame(time) {
        if (!running) return;
        requestAnimationFrame(bootFrame);

        if (!startTime) { startTime = time; lastRenderTime = time; lastCreepTime = time; }
        const timeSinceLastRender = time - lastRenderTime;
        if (timeSinceLastRender <= frameInterval) return;
        lastRenderTime = time - (timeSinceLastRender % frameInterval);

        // Creep the loading bar ~1 % every 500 ms while scripts are loading
        if (!bootLogActive && time - lastCreepTime >= 500) {
            lastCreepTime = time;
            scriptLoadProgress = Math.min(scriptLoadProgress + 0.01, 0.99);
        }

        const progress = Math.min((time - startTime) / BOOT_DURATION, 1.0);

        // Camera orbit → zoom
        if (progress < 0.55) {
            const t     = easeInOutCubic(progress / 0.55);
            const angle = (1.0 - t) * (Math.PI / 2);
            camera.position.set(
                Math.sin(angle) * 11.5,
                3.3 + 1.2 * (1 - t),
                Math.cos(angle) * 11.5 + SCREEN_Z
            );
            camera.lookAt(0, 3.3, SCREEN_Z);
        } else {
            const t = easeInOutCubic((progress - 0.55) / 0.45);
            camera.position.set(
                THREE.MathUtils.lerp(0,             finalCameraX, t),
                THREE.MathUtils.lerp(3.3,           finalCameraY, t),
                THREE.MathUtils.lerp(11.5 + SCREEN_Z, FINAL_Z,   t)
            );
            camera.lookAt(
                THREE.MathUtils.lerp(0,   finalCameraX, t),
                THREE.MathUtils.lerp(3.3, finalCameraY, t),
                SCREEN_Z
            );
        }

        // Wobble chromatic aberration during orbit
        const d   = Math.max(0, 1 - progress);
        const wx1 = Math.sin(time * 0.015) * 0.006 * d;
        const wy1 = Math.cos(time * 0.011) * 0.004 * d;
        const wx2 = Math.cos(time * 0.018) * 0.005 * d;
        const wy2 = Math.sin(time * 0.013) * 0.003 * d;
        postMaterial.uniforms.rOffset.value.set( 3.0 / window.innerWidth + wx1,  wy1);
        postMaterial.uniforms.gOffset.value.set(wx1 * 0.2, wy2 * 0.2);
        postMaterial.uniforms.bOffset.value.set(-3.0 / window.innerWidth + wx2,  wy2);

        // Start quick boot log once scripts are loaded AND min logo time has elapsed
        if (scriptsLoaded && !bootLogActive && (time - startTime) >= MIN_LOGO_DURATION) {
            bootLogActive    = true;
            bootLogStartTime = time;
        }

        // Mark boot log done once its timer elapses
        if (bootLogActive && !bootLogDone &&
                bootLogStartTime !== null && (time - bootLogStartTime) >= QUICK_BOOT_DURATION) {
            bootLogDone = true;
        }

        renderScreenTexture(time);
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);

        if (progress >= 1.0 && bootLogDone) {
            running = false;
            resolveAnimation();
        }
    }

    let resolveAnimation;
    const animationDone = new Promise(resolve => { resolveAnimation = resolve; });

    requestAnimationFrame(bootFrame);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderTarget.setSize(
            window.innerWidth  * window.devicePixelRatio,
            window.innerHeight * window.devicePixelRatio
        );
        updateCameraTargets();
    });

    return {
        promise:             animationDone,
        cleanup:             () => renderer.dispose(),
        notifyLoadProgress:  (f) => { scriptLoadTarget = f; scriptLoadProgress = Math.max(scriptLoadProgress, f); },
        notifyScriptsLoaded: ()  => { scriptsLoaded = true;  }
    };
}

// ---------------------------------------------------------------------------
// Noise Canvas (grain animation)
// ---------------------------------------------------------------------------
function startNoise() {
    const canvas = document.getElementById('noise');
    const ctx    = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function generateNoise() {
        const idata = ctx.createImageData(canvas.width, canvas.height);
        const buf   = new Uint32Array(idata.data.buffer);
        for (let i = 0; i < buf.length; i++) {
            if (Math.random() < 0.45) buf[i] = 0xff000000;
        }
        ctx.putImageData(idata, 0, 0);
        requestAnimationFrame(generateNoise);
    }
    generateNoise();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
let term;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

const FS_STORAGE_KEY = 'pmtv-rootfs';
const FS_HASH_KEY = 'pmtv-fs-hash';

async function computeBufferHash(buf) {
    if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
        const hashBuf = await window.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    const u8 = new Uint8Array(buf);
    let h = 0x811c9dc5;
    for (let i = 0; i < u8.length; i++) {
        h ^= u8[i];
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
}

async function resetFilesystem() {
    try {
        localStorage.removeItem(FS_HASH_KEY);
    } catch (_) {}
    if (typeof indexedDB !== 'undefined') {
        try {
            await new Promise((resolve) => {
                const req = indexedDB.deleteDatabase('brsh_fs_storage');
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
            });
        } catch (_) {}
    }
}
globalThis.resetFilesystem = resetFilesystem;

let serverCommandsBundle = null;
let serverCommandMap = {};

function extractCommandsBundle(u8) {
    if (!u8 || !globalThis.Shell || !globalThis.Shell.BinaryContainer) return null;
    try {
        if (!globalThis.Shell.BinaryContainer.isBinaryContainer(u8)) return null;
        const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        const hlen = view.getUint32(8, true);
        if (12 + hlen <= u8.byteLength) {
            const header = JSON.parse(new TextDecoder().decode(u8.subarray(12, 12 + hlen)));
            if (Array.isArray(header.commandsSlice)) {
                const [off, len] = header.commandsSlice;
                const payload = u8.subarray(12 + hlen);
                return new TextDecoder().decode(payload.subarray(off, off + len));
            }
        }
    } catch (_) {}
    return null;
}

function collectCommandFunctions(node, path = "") {
    const map = {};
    function walk(curr, currPath) {
        if (!curr || typeof curr !== "object" || curr instanceof Uint8Array) return;
        for (const [k, v] of Object.entries(curr)) {
            const p = `${currPath}/${k}`;
            if (typeof v === "function") {
                map[p] = v;
                map[k] = v;
            } else if (v && typeof v === "object" && !(v instanceof Uint8Array)) {
                walk(v, p);
            }
        }
    }
    walk(node, path);
    return map;
}

function relinkServerCommands(target, source) {
    if (!target || !source || typeof target !== "object" || typeof source !== "object") return;
    for (const [k, v] of Object.entries(source)) {
        if (typeof v === "function") {
            target[k] = v;
        } else if (v && typeof v === "object" && !(v instanceof Uint8Array) && target[k] && typeof target[k] === "object" && !(target[k] instanceof Uint8Array)) {
            relinkServerCommands(target[k], v);
        }
    }
}

function createAutoSaveHandler(key = FS_STORAGE_KEY) {
    return (rawFs, rawPerms) => {
        try {
            if (!globalThis.Shell || !globalThis.Shell.BinaryContainer || !globalThis.Shell.Storage) return;
            const options = serverCommandsBundle ? { commandsBundle: serverCommandsBundle } : {};
            const bytes = globalThis.Shell.BinaryContainer.serializeBinaryFilesystem(rawFs, rawPerms, options);
            if (typeof indexedDB !== "undefined") {
                globalThis.Shell.Storage._idbPut(key, bytes).catch(() => {});
            }
        } catch (err) {
            console.warn("Auto-save failed:", err);
        }
    };
}

async function loadFilesystem(url) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("reset") || window.location.hash === "#reset") {
            console.log("Reset parameter detected. Purging persisted filesystem.");
            await resetFilesystem();
            if (urlParams.has("reset")) {
                urlParams.delete("reset");
                const newSearch = urlParams.toString();
                const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "") + window.location.hash;
                window.history.replaceState(null, "", newUrl);
            }
        }
    } catch (_) {}

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch filesystem from ${url}: HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const serverHash = await computeBufferHash(buf);

    let savedHash = null;
    try {
        savedHash = localStorage.getItem(FS_HASH_KEY);
    } catch (_) {}

    let u8 = new Uint8Array(buf);
    if (u8[0] === 0x1f && u8[1] === 0x8b) {
        const ds = new DecompressionStream("gzip");
        const writer = ds.writable.getWriter();
        writer.write(u8);
        writer.close();
        const decompressed = await new Response(ds.readable).arrayBuffer();
        u8 = new Uint8Array(decompressed);
    }

    try {
        localStorage.setItem(FS_HASH_KEY, serverHash);
    } catch (_) {}

    serverCommandsBundle = extractCommandsBundle(u8);
    const serverFs = globalThis.Shell && globalThis.Shell.BinaryContainer
        ? globalThis.Shell.BinaryContainer.deserializeBinaryFilesystem(u8)
        : { filesystem: u8, permissions: {} };

    if (serverFs && serverFs.filesystem) {
        serverCommandMap = collectCommandFunctions(serverFs.filesystem);
    }

    // Check if we have a persisted snapshot that matches the current server build
    if (savedHash && savedHash === serverHash && globalThis.Shell && globalThis.Shell.Storage) {
        try {
            const savedData = await globalThis.Shell.Storage._idbGet(FS_STORAGE_KEY);
            if (savedData && globalThis.Shell.BinaryContainer && globalThis.Shell.BinaryContainer.isBinaryContainer(savedData)) {
                const savedFs = globalThis.Shell.BinaryContainer.deserializeBinaryFilesystem(savedData, serverCommandMap);
                if (savedFs && savedFs.filesystem && typeof savedFs.filesystem === "object") {
                    if (serverFs && serverFs.filesystem) {
                        relinkServerCommands(savedFs.filesystem, serverFs.filesystem);
                    }
                    console.log("Loaded persisted filesystem snapshot from IndexedDB.");
                    return savedFs;
                }
            }
        } catch (err) {
            console.warn("Failed to load persisted filesystem snapshot, resetting to server image:", err);
            await resetFilesystem();
        }
    } else if (savedHash && savedHash !== serverHash) {
        console.log("New filesystem build detected. Resetting to server image.");
        await resetFilesystem();
    }

    return serverFs;
}

function init() {
    gaInit();
    startNoise();

    const boot = startBootAnimation();

    // Load scripts in dependency order, updating the loading bar after each
    const scriptsReady = loadScript('//unpkg.com/brsh@3/dist/shell.min.js')
        .then(() => { boot.notifyLoadProgress(1 / 4); return loadScript('//unpkg.com/brsh@3/dist/terminal.min.js'); })
        .then(() => { boot.notifyLoadProgress(2 / 4); return loadScript('//unpkg.com/brsh@3/dist/wbt.min.js'); })
        .then(() => { boot.notifyLoadProgress(3 / 4); return loadFilesystem('/fs.brfs'); })
        .then((resolvedFs) => {
            globalThis.fs = resolvedFs;
            boot.notifyLoadProgress(1);
            boot.notifyScriptsLoaded(); // triggers quick boot log on screen
        });

    
    // Initialise Terminal as soon as scripts are loaded (hidden behind boot screen)
    scriptsReady.then(async () => {
        if (globalThis.Terminal && globalThis.Terminal.prototype) {
            Terminal.prototype._measureAndSetSize = function() {
                if (!this._charMeasure || !this._el || typeof this._el.getBoundingClientRect !== 'function') return;
                const charRect = this._charMeasure.getBoundingClientRect();
                const elRect = this._el.getBoundingClientRect();
                if (!charRect || !elRect || !charRect.width || !charRect.height || !elRect.width) return;

                const style = window.getComputedStyle(this._el);
                const padLeft = parseFloat(style.paddingLeft) || 0;
                const padRight = parseFloat(style.paddingRight) || 0;
                const padTop = parseFloat(style.paddingTop) || 0;
                const padBottom = parseFloat(style.paddingBottom) || 0;

                const clientW = this._el.clientWidth || elRect.width;
                const clientH = this._el.clientHeight || elRect.height;

                const availableWidth = clientW - padLeft - padRight;
                const availableHeight = clientH - padTop - padBottom;

                if (availableWidth <= 0 || availableHeight <= 0) return;

                const cols = Math.max(1, Math.floor(availableWidth / charRect.width));
                const rows = Math.max(1, Math.floor(availableHeight / charRect.height));

                if (cols !== this._lastCols || rows !== this._lastRows) {
                    this.resize(cols, rows);
                }
            };
        }

        const termOptions = {
            el:              document.querySelector('.terminal'),
            hostname:        BOOT_HOSTNAME,
            profile:         '/home/.profile',
            cwd:             '/home',
            cursor:          'blink',
            outputAnimation: 'type',
            animateSpeed:    20,
            lineWrap:        true,
            filesystem:      fs.filesystem,
            permissions:     fs.permissions,
            onFsChange:      createAutoSaveHandler(FS_STORAGE_KEY),
            onExit: () => { window.location.href = 'https://google.com/'; }
        };

        try {
            term = new Terminal(termOptions);
        } catch (err) {
            console.error('Terminal init failed with current filesystem, attempting fallback to factory default:', err);
            await resetFilesystem();
            const freshFs = await loadFilesystem('/fs.brfs');
            term = new Terminal(Object.assign({}, termOptions, {
                filesystem: freshFs.filesystem,
                permissions: freshFs.permissions
            }));
        }

        globalThis.term = term;

        window.addEventListener('resize', () => {
            if (term && typeof term._measureAndSetSize === 'function') {
                term._measureAndSetSize();
            }
        });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                if (term && typeof term._measureAndSetSize === 'function') {
                    term._measureAndSetSize();
                }
            });
        }

        const LocalCommand = Object.getPrototypeOf(term.cli.context.getCommand('cd'));

        if (globalThis.Wbt && LocalCommand) {
            if (!(Wbt.prototype instanceof LocalCommand)) {
                Object.setPrototypeOf(Wbt.prototype, LocalCommand.prototype);
            }
            term.cli.context.setCommand(Wbt);
            if (typeof Wbt.restoreInstalled === "function") {
                try {
                    Wbt.restoreInstalled(term.cli);
                } catch (_) {}
            }
        }

        if (LocalCommand) {
            class ResetCommand extends LocalCommand {
                static get name() { return 'reset'; }
                async run() {
                    this.write('Resetting terminal filesystem to factory defaults...\r\n');
                    if (typeof globalThis.resetFilesystem === 'function') {
                        await globalThis.resetFilesystem();
                    }
                    setTimeout(() => {
                        window.location.reload();
                    }, 400);
                    return Promise.resolve();
                }
            }
            term.cli.context.setCommand(ResetCommand);
            term.cli.context.setAlias('factory-reset', 'reset');
        }

        if (term.cli && term.cli.constructor && term.cli.constructor.prototype) {
            const origOnCommand = term.cli.constructor.prototype.onCommand;
            term.cli.constructor.prototype.onCommand = async function(cmdLine, ...rest) {
                if (typeof cmdLine === 'string') {
                    const trimmed = cmdLine.trim();
                    const firstSpace = trimmed.indexOf(' ');
                    const firstWord = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
                    const alias = this.context.getAlias(firstWord);
                    if (alias && firstSpace !== -1) {
                        const expanded = alias + ' ' + trimmed.slice(firstSpace + 1);
                        return origOnCommand.call(this, expanded, ...rest);
                    }
                }
                return origOnCommand.call(this, cmdLine, ...rest);
            };
        }

        const nav = document.querySelectorAll('.nav a');
        nav.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault && e.preventDefault();
                const cmd  = e.currentTarget.getAttribute('data-command');
                const vars = hashToVariables();
                vars.cmd   = cmd;
                variablesToHash(vars);
            });
        });

        cmdFromHash(true);
    });

    // Reveal once camera zoom + quick boot log are both complete
    boot.promise.then(() => {
        const container = document.getElementById('boot-container');
        container.classList.add('fade-out');
        document.getElementById('main-content').classList.add('visible');
        if (term && typeof term._measureAndSetSize === 'function') {
            term._measureAndSetSize();
        }
        setTimeout(() => {
            boot.cleanup();
            container.style.display = 'none';
        }, 650);
        // Slide in the right panel after the fade completes (non-mobile only)
        setTimeout(() => {
            document.querySelector('.right').classList.add('slide-in');
            if (term && typeof term._measureAndSetSize === 'function') {
                term._measureAndSetSize();
            }
        }, 500);
    });
}

function hashToVariables() {
    if (!window.location.hash || window.location.hash === '#' || !window.location.hash.includes('=')) {
        return {};
    }
    return [
        ...(window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash).split('&')
    ].reduce((acc, v) => {
        [k, v] = v.split('=');
        return { ...acc, [k]: decodeURIComponent(v) };
    }, {});
}

function variablesToHash(vars) {
    window.location.hash = Object.entries(vars).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

function cmdFromPath() {
    const pathname = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
    if (!pathname || pathname === '') {
        return null;
    }
    return decodeURIComponent(pathname);
}

function cmdFromHash(listen = false) {
    const { cmd } = hashToVariables();
    if (cmd) {
        term.onCommand(cmd);
    } else if (listen) {
        const pathCmd = cmdFromPath();
        if (pathCmd) {
            term.onCommand(pathCmd);
        }
    }
    if (listen) {
        window.addEventListener('hashchange', () => cmdFromHash());
    }
}

function gaInit() {
    (function (a, c, d, p, h, k, l) {
        a.GoogleAnalyticsObject = h;
        a[h] = a[h] || function () { (a[h].q = a[h].q || []).push(arguments); };
        a[h].a = 1 * new Date;
        k = c.createElement(d);
        l = c.getElementsByTagName(d)[0];
        k.async = 1;
        k.src = p;
        l.parentNode.insertBefore(k, l);
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
    ga('create', 'UA-78482123-1', 'auto');
    ga('send', 'pageview');
}
