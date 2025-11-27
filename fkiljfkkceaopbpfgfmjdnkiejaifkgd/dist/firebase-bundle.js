/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Ri = function(t) {
  const e = [];
  let n = 0;
  for (let s = 0; s < t.length; s++) {
    let r = t.charCodeAt(s);
    r < 128 ? e[n++] = r : r < 2048 ? (e[n++] = r >> 6 | 192, e[n++] = r & 63 | 128) : (r & 64512) === 55296 && s + 1 < t.length && (t.charCodeAt(s + 1) & 64512) === 56320 ? (r = 65536 + ((r & 1023) << 10) + (t.charCodeAt(++s) & 1023), e[n++] = r >> 18 | 240, e[n++] = r >> 12 & 63 | 128, e[n++] = r >> 6 & 63 | 128, e[n++] = r & 63 | 128) : (e[n++] = r >> 12 | 224, e[n++] = r >> 6 & 63 | 128, e[n++] = r & 63 | 128);
  }
  return e;
}, Ya = function(t) {
  const e = [];
  let n = 0, s = 0;
  for (; n < t.length; ) {
    const r = t[n++];
    if (r < 128)
      e[s++] = String.fromCharCode(r);
    else if (r > 191 && r < 224) {
      const i = t[n++];
      e[s++] = String.fromCharCode((r & 31) << 6 | i & 63);
    } else if (r > 239 && r < 365) {
      const i = t[n++], o = t[n++], a = t[n++], u = ((r & 7) << 18 | (i & 63) << 12 | (o & 63) << 6 | a & 63) - 65536;
      e[s++] = String.fromCharCode(55296 + (u >> 10)), e[s++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      const i = t[n++], o = t[n++];
      e[s++] = String.fromCharCode((r & 15) << 12 | (i & 63) << 6 | o & 63);
    }
  }
  return e.join("");
}, Ni = {
  /**
   * Maps bytes to characters.
   */
  byteToCharMap_: null,
  /**
   * Maps characters to bytes.
   */
  charToByteMap_: null,
  /**
   * Maps bytes to websafe characters.
   * @private
   */
  byteToCharMapWebSafe_: null,
  /**
   * Maps websafe characters to bytes.
   * @private
   */
  charToByteMapWebSafe_: null,
  /**
   * Our default alphabet, shared between
   * ENCODED_VALS and ENCODED_VALS_WEBSAFE
   */
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  /**
   * Our default alphabet. Value 64 (=) is special; it means "nothing."
   */
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  /**
   * Our websafe alphabet.
   */
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  /**
   * Whether this browser supports the atob and btoa functions. This extension
   * started at Mozilla but is now implemented by many browsers. We use the
   * ASSUME_* variables to avoid pulling in the full useragent detection library
   * but still allowing the standard per-browser compilations.
   *
   */
  HAS_NATIVE_SUPPORT: typeof atob == "function",
  /**
   * Base64-encode an array of bytes.
   *
   * @param input An array of bytes (numbers with
   *     value in [0, 255]) to encode.
   * @param webSafe Boolean indicating we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeByteArray(t, e) {
    if (!Array.isArray(t))
      throw Error("encodeByteArray takes an array as a parameter");
    this.init_();
    const n = e ? this.byteToCharMapWebSafe_ : this.byteToCharMap_, s = [];
    for (let r = 0; r < t.length; r += 3) {
      const i = t[r], o = r + 1 < t.length, a = o ? t[r + 1] : 0, u = r + 2 < t.length, c = u ? t[r + 2] : 0, h = i >> 2, l = (i & 3) << 4 | a >> 4;
      let f = (a & 15) << 2 | c >> 6, g = c & 63;
      u || (g = 64, o || (f = 64)), s.push(n[h], n[l], n[f], n[g]);
    }
    return s.join("");
  },
  /**
   * Base64-encode a string.
   *
   * @param input A string to encode.
   * @param webSafe If true, we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeString(t, e) {
    return this.HAS_NATIVE_SUPPORT && !e ? btoa(t) : this.encodeByteArray(Ri(t), e);
  },
  /**
   * Base64-decode a string.
   *
   * @param input to decode.
   * @param webSafe True if we should use the
   *     alternative alphabet.
   * @return string representing the decoded value.
   */
  decodeString(t, e) {
    return this.HAS_NATIVE_SUPPORT && !e ? atob(t) : Ya(this.decodeStringToByteArray(t, e));
  },
  /**
   * Base64-decode a string.
   *
   * In base-64 decoding, groups of four characters are converted into three
   * bytes.  If the encoder did not apply padding, the input length may not
   * be a multiple of 4.
   *
   * In this case, the last group will have fewer than 4 characters, and
   * padding will be inferred.  If the group has one or two characters, it decodes
   * to one byte.  If the group has three characters, it decodes to two bytes.
   *
   * @param input Input to decode.
   * @param webSafe True if we should use the web-safe alphabet.
   * @return bytes representing the decoded value.
   */
  decodeStringToByteArray(t, e) {
    this.init_();
    const n = e ? this.charToByteMapWebSafe_ : this.charToByteMap_, s = [];
    for (let r = 0; r < t.length; ) {
      const i = n[t.charAt(r++)], a = r < t.length ? n[t.charAt(r)] : 0;
      ++r;
      const c = r < t.length ? n[t.charAt(r)] : 64;
      ++r;
      const l = r < t.length ? n[t.charAt(r)] : 64;
      if (++r, i == null || a == null || c == null || l == null)
        throw Error();
      const f = i << 2 | a >> 4;
      if (s.push(f), c !== 64) {
        const g = a << 4 & 240 | c >> 2;
        if (s.push(g), l !== 64) {
          const T = c << 6 & 192 | l;
          s.push(T);
        }
      }
    }
    return s;
  },
  /**
   * Lazy static initialization function. Called before
   * accessing any of the static map variables.
   * @private
   */
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {}, this.charToByteMap_ = {}, this.byteToCharMapWebSafe_ = {}, this.charToByteMapWebSafe_ = {};
      for (let t = 0; t < this.ENCODED_VALS.length; t++)
        this.byteToCharMap_[t] = this.ENCODED_VALS.charAt(t), this.charToByteMap_[this.byteToCharMap_[t]] = t, this.byteToCharMapWebSafe_[t] = this.ENCODED_VALS_WEBSAFE.charAt(t), this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]] = t, t >= this.ENCODED_VALS_BASE.length && (this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)] = t, this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)] = t);
    }
  }
}, Ja = function(t) {
  const e = Ri(t);
  return Ni.encodeByteArray(e, !0);
}, nn = function(t) {
  return Ja(t).replace(/\./g, "");
}, Za = function(t) {
  try {
    return Ni.decodeString(t, !0);
  } catch (e) {
    console.error("base64Decode failed: ", e);
  }
  return null;
};
function eu() {
  try {
    return Object.prototype.toString.call(global.process) === "[object process]";
  } catch {
    return !1;
  }
}
function tu() {
  try {
    return typeof indexedDB == "object";
  } catch {
    return !1;
  }
}
function nu() {
  return new Promise((t, e) => {
    try {
      let n = !0;
      const s = "validate-browser-context-for-indexeddb-analytics-module", r = self.indexedDB.open(s);
      r.onsuccess = () => {
        r.result.close(), n || self.indexedDB.deleteDatabase(s), t(!0);
      }, r.onupgradeneeded = () => {
        n = !1;
      }, r.onerror = () => {
        var i;
        e(((i = r.error) === null || i === void 0 ? void 0 : i.message) || "");
      };
    } catch (n) {
      e(n);
    }
  });
}
function su() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("Unable to locate global object.");
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ru = () => su().__FIREBASE_DEFAULTS__, iu = () => {
  if (typeof process > "u" || typeof process.env > "u")
    return;
  const t = process.env.__FIREBASE_DEFAULTS__;
  if (t)
    return JSON.parse(t);
}, ou = () => {
  if (typeof document > "u")
    return;
  let t;
  try {
    t = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  } catch {
    return;
  }
  const e = t && Za(t[1]);
  return e && JSON.parse(e);
}, xi = () => {
  try {
    return ru() || iu() || ou();
  } catch (t) {
    console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);
    return;
  }
}, au = (t) => {
  var e, n;
  return (n = (e = xi()) === null || e === void 0 ? void 0 : e.emulatorHosts) === null || n === void 0 ? void 0 : n[t];
}, Oi = (t) => {
  const e = au(t);
  if (!e)
    return;
  const n = e.lastIndexOf(":");
  if (n <= 0 || n + 1 === e.length)
    throw new Error(`Invalid host ${e} with no separate hostname and port!`);
  const s = parseInt(e.substring(n + 1), 10);
  return e[0] === "[" ? [e.substring(1, n - 1), s] : [e.substring(0, n), s];
}, uu = () => {
  var t;
  return (t = xi()) === null || t === void 0 ? void 0 : t.config;
};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class cu {
  constructor() {
    this.reject = () => {
    }, this.resolve = () => {
    }, this.promise = new Promise((e, n) => {
      this.resolve = e, this.reject = n;
    });
  }
  /**
   * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
   * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
   * and returns a node-style callback which will resolve or reject the Deferred's promise.
   */
  wrapCallback(e) {
    return (n, s) => {
      n ? this.reject(n) : this.resolve(s), typeof e == "function" && (this.promise.catch(() => {
      }), e.length === 1 ? e(n) : e(n, s));
    };
  }
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Li(t, e) {
  if (t.uid)
    throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');
  const n = {
    alg: "none",
    type: "JWT"
  }, s = e || "demo-project", r = t.iat || 0, i = t.sub || t.user_id;
  if (!i)
    throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");
  const o = Object.assign({
    // Set all required fields to decent defaults
    iss: `https://securetoken.google.com/${s}`,
    aud: s,
    iat: r,
    exp: r + 3600,
    auth_time: r,
    sub: i,
    user_id: i,
    firebase: {
      sign_in_provider: "custom",
      identities: {}
    }
  }, t);
  return [
    nn(JSON.stringify(n)),
    nn(JSON.stringify(o)),
    ""
  ].join(".");
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const hu = "FirebaseError";
class Ve extends Error {
  constructor(e, n, s) {
    super(n), this.code = e, this.customData = s, this.name = hu, Object.setPrototypeOf(this, Ve.prototype), Error.captureStackTrace && Error.captureStackTrace(this, Mi.prototype.create);
  }
}
class Mi {
  constructor(e, n, s) {
    this.service = e, this.serviceName = n, this.errors = s;
  }
  create(e, ...n) {
    const s = n[0] || {}, r = `${this.service}/${e}`, i = this.errors[e], o = i ? lu(i, s) : "Error", a = `${this.serviceName}: ${o} (${r}).`;
    return new Ve(r, a, s);
  }
}
function lu(t, e) {
  return t.replace(du, (n, s) => {
    const r = e[s];
    return r != null ? String(r) : `<${s}?>`;
  });
}
const du = /\{\$([^}]+)}/g;
function as(t, e) {
  if (t === e)
    return !0;
  const n = Object.keys(t), s = Object.keys(e);
  for (const r of n) {
    if (!s.includes(r))
      return !1;
    const i = t[r], o = e[r];
    if (Ar(i) && Ar(o)) {
      if (!as(i, o))
        return !1;
    } else if (i !== o)
      return !1;
  }
  for (const r of s)
    if (!n.includes(r))
      return !1;
  return !0;
}
function Ar(t) {
  return t !== null && typeof t == "object";
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function yn(t) {
  return t && t._delegate ? t._delegate : t;
}
class Qe {
  /**
   *
   * @param name The public service name, e.g. app, auth, firestore, database
   * @param instanceFactory Service factory responsible for creating the public interface
   * @param type whether the service provided by the component is public or private
   */
  constructor(e, n, s) {
    this.name = e, this.instanceFactory = n, this.type = s, this.multipleInstances = !1, this.serviceProps = {}, this.instantiationMode = "LAZY", this.onInstanceCreated = null;
  }
  setInstantiationMode(e) {
    return this.instantiationMode = e, this;
  }
  setMultipleInstances(e) {
    return this.multipleInstances = e, this;
  }
  setServiceProps(e) {
    return this.serviceProps = e, this;
  }
  setInstanceCreatedCallback(e) {
    return this.onInstanceCreated = e, this;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const _e = "[DEFAULT]";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class fu {
  constructor(e, n) {
    this.name = e, this.container = n, this.component = null, this.instances = /* @__PURE__ */ new Map(), this.instancesDeferred = /* @__PURE__ */ new Map(), this.instancesOptions = /* @__PURE__ */ new Map(), this.onInitCallbacks = /* @__PURE__ */ new Map();
  }
  /**
   * @param identifier A provider can provide mulitple instances of a service
   * if this.component.multipleInstances is true.
   */
  get(e) {
    const n = this.normalizeInstanceIdentifier(e);
    if (!this.instancesDeferred.has(n)) {
      const s = new cu();
      if (this.instancesDeferred.set(n, s), this.isInitialized(n) || this.shouldAutoInitialize())
        try {
          const r = this.getOrInitializeService({
            instanceIdentifier: n
          });
          r && s.resolve(r);
        } catch {
        }
    }
    return this.instancesDeferred.get(n).promise;
  }
  getImmediate(e) {
    var n;
    const s = this.normalizeInstanceIdentifier(e == null ? void 0 : e.identifier), r = (n = e == null ? void 0 : e.optional) !== null && n !== void 0 ? n : !1;
    if (this.isInitialized(s) || this.shouldAutoInitialize())
      try {
        return this.getOrInitializeService({
          instanceIdentifier: s
        });
      } catch (i) {
        if (r)
          return null;
        throw i;
      }
    else {
      if (r)
        return null;
      throw Error(`Service ${this.name} is not available`);
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(e) {
    if (e.name !== this.name)
      throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);
    if (this.component)
      throw Error(`Component for ${this.name} has already been provided`);
    if (this.component = e, !!this.shouldAutoInitialize()) {
      if (gu(e))
        try {
          this.getOrInitializeService({ instanceIdentifier: _e });
        } catch {
        }
      for (const [n, s] of this.instancesDeferred.entries()) {
        const r = this.normalizeInstanceIdentifier(n);
        try {
          const i = this.getOrInitializeService({
            instanceIdentifier: r
          });
          s.resolve(i);
        } catch {
        }
      }
    }
  }
  clearInstance(e = _e) {
    this.instancesDeferred.delete(e), this.instancesOptions.delete(e), this.instances.delete(e);
  }
  // app.delete() will call this method on every provider to delete the services
  // TODO: should we mark the provider as deleted?
  async delete() {
    const e = Array.from(this.instances.values());
    await Promise.all([
      ...e.filter((n) => "INTERNAL" in n).map((n) => n.INTERNAL.delete()),
      ...e.filter((n) => "_delete" in n).map((n) => n._delete())
    ]);
  }
  isComponentSet() {
    return this.component != null;
  }
  isInitialized(e = _e) {
    return this.instances.has(e);
  }
  getOptions(e = _e) {
    return this.instancesOptions.get(e) || {};
  }
  initialize(e = {}) {
    const { options: n = {} } = e, s = this.normalizeInstanceIdentifier(e.instanceIdentifier);
    if (this.isInitialized(s))
      throw Error(`${this.name}(${s}) has already been initialized`);
    if (!this.isComponentSet())
      throw Error(`Component ${this.name} has not been registered yet`);
    const r = this.getOrInitializeService({
      instanceIdentifier: s,
      options: n
    });
    for (const [i, o] of this.instancesDeferred.entries()) {
      const a = this.normalizeInstanceIdentifier(i);
      s === a && o.resolve(r);
    }
    return r;
  }
  /**
   *
   * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
   * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
   *
   * @param identifier An optional instance identifier
   * @returns a function to unregister the callback
   */
  onInit(e, n) {
    var s;
    const r = this.normalizeInstanceIdentifier(n), i = (s = this.onInitCallbacks.get(r)) !== null && s !== void 0 ? s : /* @__PURE__ */ new Set();
    i.add(e), this.onInitCallbacks.set(r, i);
    const o = this.instances.get(r);
    return o && e(o, r), () => {
      i.delete(e);
    };
  }
  /**
   * Invoke onInit callbacks synchronously
   * @param instance the service instance`
   */
  invokeOnInitCallbacks(e, n) {
    const s = this.onInitCallbacks.get(n);
    if (s)
      for (const r of s)
        try {
          r(e, n);
        } catch {
        }
  }
  getOrInitializeService({ instanceIdentifier: e, options: n = {} }) {
    let s = this.instances.get(e);
    if (!s && this.component && (s = this.component.instanceFactory(this.container, {
      instanceIdentifier: pu(e),
      options: n
    }), this.instances.set(e, s), this.instancesOptions.set(e, n), this.invokeOnInitCallbacks(s, e), this.component.onInstanceCreated))
      try {
        this.component.onInstanceCreated(this.container, e, s);
      } catch {
      }
    return s || null;
  }
  normalizeInstanceIdentifier(e = _e) {
    return this.component ? this.component.multipleInstances ? e : _e : e;
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT";
  }
}
function pu(t) {
  return t === _e ? void 0 : t;
}
function gu(t) {
  return t.instantiationMode === "EAGER";
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class mu {
  constructor(e) {
    this.name = e, this.providers = /* @__PURE__ */ new Map();
  }
  /**
   *
   * @param component Component being added
   * @param overwrite When a component with the same name has already been registered,
   * if overwrite is true: overwrite the existing component with the new component and create a new
   * provider with the new component. It can be useful in tests where you want to use different mocks
   * for different tests.
   * if overwrite is false: throw an exception
   */
  addComponent(e) {
    const n = this.getProvider(e.name);
    if (n.isComponentSet())
      throw new Error(`Component ${e.name} has already been registered with ${this.name}`);
    n.setComponent(e);
  }
  addOrOverwriteComponent(e) {
    this.getProvider(e.name).isComponentSet() && this.providers.delete(e.name), this.addComponent(e);
  }
  /**
   * getProvider provides a type safe interface where it can only be called with a field name
   * present in NameServiceMapping interface.
   *
   * Firebase SDKs providing services should extend NameServiceMapping interface to register
   * themselves.
   */
  getProvider(e) {
    if (this.providers.has(e))
      return this.providers.get(e);
    const n = new fu(e, this);
    return this.providers.set(e, n), n;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var k;
(function(t) {
  t[t.DEBUG = 0] = "DEBUG", t[t.VERBOSE = 1] = "VERBOSE", t[t.INFO = 2] = "INFO", t[t.WARN = 3] = "WARN", t[t.ERROR = 4] = "ERROR", t[t.SILENT = 5] = "SILENT";
})(k || (k = {}));
const yu = {
  debug: k.DEBUG,
  verbose: k.VERBOSE,
  info: k.INFO,
  warn: k.WARN,
  error: k.ERROR,
  silent: k.SILENT
}, vu = k.INFO, wu = {
  [k.DEBUG]: "log",
  [k.VERBOSE]: "log",
  [k.INFO]: "info",
  [k.WARN]: "warn",
  [k.ERROR]: "error"
}, Eu = (t, e, ...n) => {
  if (e < t.logLevel)
    return;
  const s = (/* @__PURE__ */ new Date()).toISOString(), r = wu[e];
  if (r)
    console[r](`[${s}]  ${t.name}:`, ...n);
  else
    throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`);
};
class Pi {
  /**
   * Gives you an instance of a Logger to capture messages according to
   * Firebase's logging scheme.
   *
   * @param name The name that the logs will be associated with
   */
  constructor(e) {
    this.name = e, this._logLevel = vu, this._logHandler = Eu, this._userLogHandler = null;
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(e) {
    if (!(e in k))
      throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);
    this._logLevel = e;
  }
  // Workaround for setter/getter having to be the same type.
  setLogLevel(e) {
    this._logLevel = typeof e == "string" ? yu[e] : e;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(e) {
    if (typeof e != "function")
      throw new TypeError("Value assigned to `logHandler` must be a function");
    this._logHandler = e;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(e) {
    this._userLogHandler = e;
  }
  /**
   * The functions below are all based on the `console` interface
   */
  debug(...e) {
    this._userLogHandler && this._userLogHandler(this, k.DEBUG, ...e), this._logHandler(this, k.DEBUG, ...e);
  }
  log(...e) {
    this._userLogHandler && this._userLogHandler(this, k.VERBOSE, ...e), this._logHandler(this, k.VERBOSE, ...e);
  }
  info(...e) {
    this._userLogHandler && this._userLogHandler(this, k.INFO, ...e), this._logHandler(this, k.INFO, ...e);
  }
  warn(...e) {
    this._userLogHandler && this._userLogHandler(this, k.WARN, ...e), this._logHandler(this, k.WARN, ...e);
  }
  error(...e) {
    this._userLogHandler && this._userLogHandler(this, k.ERROR, ...e), this._logHandler(this, k.ERROR, ...e);
  }
}
const Tu = (t, e) => e.some((n) => t instanceof n);
let Dr, kr;
function bu() {
  return Dr || (Dr = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function Cu() {
  return kr || (kr = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const Fi = /* @__PURE__ */ new WeakMap(), us = /* @__PURE__ */ new WeakMap(), Ui = /* @__PURE__ */ new WeakMap(), Kn = /* @__PURE__ */ new WeakMap(), Us = /* @__PURE__ */ new WeakMap();
function Su(t) {
  const e = new Promise((n, s) => {
    const r = () => {
      t.removeEventListener("success", i), t.removeEventListener("error", o);
    }, i = () => {
      n(ve(t.result)), r();
    }, o = () => {
      s(t.error), r();
    };
    t.addEventListener("success", i), t.addEventListener("error", o);
  });
  return e.then((n) => {
    n instanceof IDBCursor && Fi.set(n, t);
  }).catch(() => {
  }), Us.set(e, t), e;
}
function Iu(t) {
  if (us.has(t))
    return;
  const e = new Promise((n, s) => {
    const r = () => {
      t.removeEventListener("complete", i), t.removeEventListener("error", o), t.removeEventListener("abort", o);
    }, i = () => {
      n(), r();
    }, o = () => {
      s(t.error || new DOMException("AbortError", "AbortError")), r();
    };
    t.addEventListener("complete", i), t.addEventListener("error", o), t.addEventListener("abort", o);
  });
  us.set(t, e);
}
let cs = {
  get(t, e, n) {
    if (t instanceof IDBTransaction) {
      if (e === "done")
        return us.get(t);
      if (e === "objectStoreNames")
        return t.objectStoreNames || Ui.get(t);
      if (e === "store")
        return n.objectStoreNames[1] ? void 0 : n.objectStore(n.objectStoreNames[0]);
    }
    return ve(t[e]);
  },
  set(t, e, n) {
    return t[e] = n, !0;
  },
  has(t, e) {
    return t instanceof IDBTransaction && (e === "done" || e === "store") ? !0 : e in t;
  }
};
function _u(t) {
  cs = t(cs);
}
function Au(t) {
  return t === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype) ? function(e, ...n) {
    const s = t.call(zn(this), e, ...n);
    return Ui.set(s, e.sort ? e.sort() : [e]), ve(s);
  } : Cu().includes(t) ? function(...e) {
    return t.apply(zn(this), e), ve(Fi.get(this));
  } : function(...e) {
    return ve(t.apply(zn(this), e));
  };
}
function Du(t) {
  return typeof t == "function" ? Au(t) : (t instanceof IDBTransaction && Iu(t), Tu(t, bu()) ? new Proxy(t, cs) : t);
}
function ve(t) {
  if (t instanceof IDBRequest)
    return Su(t);
  if (Kn.has(t))
    return Kn.get(t);
  const e = Du(t);
  return e !== t && (Kn.set(t, e), Us.set(e, t)), e;
}
const zn = (t) => Us.get(t);
function ku(t, e, { blocked: n, upgrade: s, blocking: r, terminated: i } = {}) {
  const o = indexedDB.open(t, e), a = ve(o);
  return s && o.addEventListener("upgradeneeded", (u) => {
    s(ve(o.result), u.oldVersion, u.newVersion, ve(o.transaction));
  }), n && o.addEventListener("blocked", () => n()), a.then((u) => {
    i && u.addEventListener("close", () => i()), r && u.addEventListener("versionchange", () => r());
  }).catch(() => {
  }), a;
}
const Ru = ["get", "getKey", "getAll", "getAllKeys", "count"], Nu = ["put", "add", "delete", "clear"], Gn = /* @__PURE__ */ new Map();
function Rr(t, e) {
  if (!(t instanceof IDBDatabase && !(e in t) && typeof e == "string"))
    return;
  if (Gn.get(e))
    return Gn.get(e);
  const n = e.replace(/FromIndex$/, ""), s = e !== n, r = Nu.includes(n);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(n in (s ? IDBIndex : IDBObjectStore).prototype) || !(r || Ru.includes(n))
  )
    return;
  const i = async function(o, ...a) {
    const u = this.transaction(o, r ? "readwrite" : "readonly");
    let c = u.store;
    return s && (c = c.index(a.shift())), (await Promise.all([
      c[n](...a),
      r && u.done
    ]))[0];
  };
  return Gn.set(e, i), i;
}
_u((t) => ({
  ...t,
  get: (e, n, s) => Rr(e, n) || t.get(e, n, s),
  has: (e, n) => !!Rr(e, n) || t.has(e, n)
}));
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class xu {
  constructor(e) {
    this.container = e;
  }
  // In initial implementation, this will be called by installations on
  // auth token refresh, and installations will send this string.
  getPlatformInfoString() {
    return this.container.getProviders().map((n) => {
      if (Ou(n)) {
        const s = n.getImmediate();
        return `${s.library}/${s.version}`;
      } else
        return null;
    }).filter((n) => n).join(" ");
  }
}
function Ou(t) {
  const e = t.getComponent();
  return (e == null ? void 0 : e.type) === "VERSION";
}
const hs = "@firebase/app", Nr = "0.9.0";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Pe = new Pi("@firebase/app"), Lu = "@firebase/app-compat", Mu = "@firebase/analytics-compat", Pu = "@firebase/analytics", Fu = "@firebase/app-check-compat", Uu = "@firebase/app-check", Bu = "@firebase/auth", Vu = "@firebase/auth-compat", $u = "@firebase/database", qu = "@firebase/database-compat", ju = "@firebase/functions", Hu = "@firebase/functions-compat", Ku = "@firebase/installations", zu = "@firebase/installations-compat", Gu = "@firebase/messaging", Wu = "@firebase/messaging-compat", Qu = "@firebase/performance", Xu = "@firebase/performance-compat", Yu = "@firebase/remote-config", Ju = "@firebase/remote-config-compat", Zu = "@firebase/storage", ec = "@firebase/storage-compat", tc = "@firebase/firestore", nc = "@firebase/firestore-compat", sc = "firebase", rc = "9.15.0";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ls = "[DEFAULT]", ic = {
  [hs]: "fire-core",
  [Lu]: "fire-core-compat",
  [Pu]: "fire-analytics",
  [Mu]: "fire-analytics-compat",
  [Uu]: "fire-app-check",
  [Fu]: "fire-app-check-compat",
  [Bu]: "fire-auth",
  [Vu]: "fire-auth-compat",
  [$u]: "fire-rtdb",
  [qu]: "fire-rtdb-compat",
  [ju]: "fire-fn",
  [Hu]: "fire-fn-compat",
  [Ku]: "fire-iid",
  [zu]: "fire-iid-compat",
  [Gu]: "fire-fcm",
  [Wu]: "fire-fcm-compat",
  [Qu]: "fire-perf",
  [Xu]: "fire-perf-compat",
  [Yu]: "fire-rc",
  [Ju]: "fire-rc-compat",
  [Zu]: "fire-gcs",
  [ec]: "fire-gcs-compat",
  [tc]: "fire-fst",
  [nc]: "fire-fst-compat",
  "fire-js": "fire-js",
  [sc]: "fire-js-all"
};
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const sn = /* @__PURE__ */ new Map(), ds = /* @__PURE__ */ new Map();
function oc(t, e) {
  try {
    t.container.addComponent(e);
  } catch (n) {
    Pe.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`, n);
  }
}
function Tt(t) {
  const e = t.name;
  if (ds.has(e))
    return Pe.debug(`There were multiple attempts to register component ${e}.`), !1;
  ds.set(e, t);
  for (const n of sn.values())
    oc(n, t);
  return !0;
}
function Bi(t, e) {
  const n = t.container.getProvider("heartbeat").getImmediate({ optional: !0 });
  return n && n.triggerHeartbeat(), t.container.getProvider(e);
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ac = {
  "no-app": "No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()",
  "bad-app-name": "Illegal App name: '{$appName}",
  "duplicate-app": "Firebase App named '{$appName}' already exists with different options or config",
  "app-deleted": "Firebase App named '{$appName}' already deleted",
  "no-options": "Need to provide options, when not being deployed to hosting via source.",
  "invalid-app-argument": "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  "invalid-log-argument": "First argument to `onLog` must be null or a function.",
  "idb-open": "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  "idb-get": "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  "idb-set": "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  "idb-delete": "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}."
}, we = new Mi("app", "Firebase", ac);
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class uc {
  constructor(e, n, s) {
    this._isDeleted = !1, this._options = Object.assign({}, e), this._config = Object.assign({}, n), this._name = n.name, this._automaticDataCollectionEnabled = n.automaticDataCollectionEnabled, this._container = s, this.container.addComponent(new Qe(
      "app",
      () => this,
      "PUBLIC"
      /* ComponentType.PUBLIC */
    ));
  }
  get automaticDataCollectionEnabled() {
    return this.checkDestroyed(), this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(e) {
    this.checkDestroyed(), this._automaticDataCollectionEnabled = e;
  }
  get name() {
    return this.checkDestroyed(), this._name;
  }
  get options() {
    return this.checkDestroyed(), this._options;
  }
  get config() {
    return this.checkDestroyed(), this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(e) {
    this._isDeleted = e;
  }
  /**
   * This function will throw an Error if the App has already been deleted -
   * use before performing API actions on the App.
   */
  checkDestroyed() {
    if (this.isDeleted)
      throw we.create("app-deleted", { appName: this._name });
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Vi = rc;
function $i(t, e = {}) {
  let n = t;
  typeof e != "object" && (e = { name: e });
  const s = Object.assign({ name: ls, automaticDataCollectionEnabled: !1 }, e), r = s.name;
  if (typeof r != "string" || !r)
    throw we.create("bad-app-name", {
      appName: String(r)
    });
  if (n || (n = uu()), !n)
    throw we.create(
      "no-options"
      /* AppError.NO_OPTIONS */
    );
  const i = sn.get(r);
  if (i) {
    if (as(n, i.options) && as(s, i.config))
      return i;
    throw we.create("duplicate-app", { appName: r });
  }
  const o = new mu(r);
  for (const u of ds.values())
    o.addComponent(u);
  const a = new uc(n, s, o);
  return sn.set(r, a), a;
}
function qi(t = ls) {
  const e = sn.get(t);
  if (!e && t === ls)
    return $i();
  if (!e)
    throw we.create("no-app", { appName: t });
  return e;
}
function Ee(t, e, n) {
  var s;
  let r = (s = ic[t]) !== null && s !== void 0 ? s : t;
  n && (r += `-${n}`);
  const i = r.match(/\s|\//), o = e.match(/\s|\//);
  if (i || o) {
    const a = [
      `Unable to register library "${r}" with version "${e}":`
    ];
    i && a.push(`library name "${r}" contains illegal characters (whitespace or "/")`), i && o && a.push("and"), o && a.push(`version name "${e}" contains illegal characters (whitespace or "/")`), Pe.warn(a.join(" "));
    return;
  }
  Tt(new Qe(
    `${r}-version`,
    () => ({ library: r, version: e }),
    "VERSION"
    /* ComponentType.VERSION */
  ));
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const cc = "firebase-heartbeat-database", hc = 1, bt = "firebase-heartbeat-store";
let Wn = null;
function ji() {
  return Wn || (Wn = ku(cc, hc, {
    upgrade: (t, e) => {
      switch (e) {
        case 0:
          t.createObjectStore(bt);
      }
    }
  }).catch((t) => {
    throw we.create("idb-open", {
      originalErrorMessage: t.message
    });
  })), Wn;
}
async function lc(t) {
  try {
    return (await ji()).transaction(bt).objectStore(bt).get(Hi(t));
  } catch (e) {
    if (e instanceof Ve)
      Pe.warn(e.message);
    else {
      const n = we.create("idb-get", {
        originalErrorMessage: e == null ? void 0 : e.message
      });
      Pe.warn(n.message);
    }
  }
}
async function xr(t, e) {
  try {
    const s = (await ji()).transaction(bt, "readwrite");
    return await s.objectStore(bt).put(e, Hi(t)), s.done;
  } catch (n) {
    if (n instanceof Ve)
      Pe.warn(n.message);
    else {
      const s = we.create("idb-set", {
        originalErrorMessage: n == null ? void 0 : n.message
      });
      Pe.warn(s.message);
    }
  }
}
function Hi(t) {
  return `${t.name}!${t.options.appId}`;
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const dc = 1024, fc = 30 * 24 * 60 * 60 * 1e3;
class pc {
  constructor(e) {
    this.container = e, this._heartbeatsCache = null;
    const n = this.container.getProvider("app").getImmediate();
    this._storage = new mc(n), this._heartbeatsCachePromise = this._storage.read().then((s) => (this._heartbeatsCache = s, s));
  }
  /**
   * Called to report a heartbeat. The function will generate
   * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
   * to IndexedDB.
   * Note that we only store one heartbeat per day. So if a heartbeat for today is
   * already logged, subsequent calls to this function in the same day will be ignored.
   */
  async triggerHeartbeat() {
    const n = this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(), s = Or();
    if (this._heartbeatsCache === null && (this._heartbeatsCache = await this._heartbeatsCachePromise), !(this._heartbeatsCache.lastSentHeartbeatDate === s || this._heartbeatsCache.heartbeats.some((r) => r.date === s)))
      return this._heartbeatsCache.heartbeats.push({ date: s, agent: n }), this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter((r) => {
        const i = new Date(r.date).valueOf();
        return Date.now() - i <= fc;
      }), this._storage.overwrite(this._heartbeatsCache);
  }
  /**
   * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
   * It also clears all heartbeats from memory as well as in IndexedDB.
   *
   * NOTE: Consuming product SDKs should not send the header if this method
   * returns an empty string.
   */
  async getHeartbeatsHeader() {
    if (this._heartbeatsCache === null && await this._heartbeatsCachePromise, this._heartbeatsCache === null || this._heartbeatsCache.heartbeats.length === 0)
      return "";
    const e = Or(), { heartbeatsToSend: n, unsentEntries: s } = gc(this._heartbeatsCache.heartbeats), r = nn(JSON.stringify({ version: 2, heartbeats: n }));
    return this._heartbeatsCache.lastSentHeartbeatDate = e, s.length > 0 ? (this._heartbeatsCache.heartbeats = s, await this._storage.overwrite(this._heartbeatsCache)) : (this._heartbeatsCache.heartbeats = [], this._storage.overwrite(this._heartbeatsCache)), r;
  }
}
function Or() {
  return (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
}
function gc(t, e = dc) {
  const n = [];
  let s = t.slice();
  for (const r of t) {
    const i = n.find((o) => o.agent === r.agent);
    if (i) {
      if (i.dates.push(r.date), Lr(n) > e) {
        i.dates.pop();
        break;
      }
    } else if (n.push({
      agent: r.agent,
      dates: [r.date]
    }), Lr(n) > e) {
      n.pop();
      break;
    }
    s = s.slice(1);
  }
  return {
    heartbeatsToSend: n,
    unsentEntries: s
  };
}
class mc {
  constructor(e) {
    this.app = e, this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    return tu() ? nu().then(() => !0).catch(() => !1) : !1;
  }
  /**
   * Read all heartbeats.
   */
  async read() {
    return await this._canUseIndexedDBPromise ? await lc(this.app) || { heartbeats: [] } : { heartbeats: [] };
  }
  // overwrite the storage with the provided heartbeats
  async overwrite(e) {
    var n;
    if (await this._canUseIndexedDBPromise) {
      const r = await this.read();
      return xr(this.app, {
        lastSentHeartbeatDate: (n = e.lastSentHeartbeatDate) !== null && n !== void 0 ? n : r.lastSentHeartbeatDate,
        heartbeats: e.heartbeats
      });
    } else
      return;
  }
  // add heartbeats
  async add(e) {
    var n;
    if (await this._canUseIndexedDBPromise) {
      const r = await this.read();
      return xr(this.app, {
        lastSentHeartbeatDate: (n = e.lastSentHeartbeatDate) !== null && n !== void 0 ? n : r.lastSentHeartbeatDate,
        heartbeats: [
          ...r.heartbeats,
          ...e.heartbeats
        ]
      });
    } else
      return;
  }
}
function Lr(t) {
  return nn(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: t })
  ).length;
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function yc(t) {
  Tt(new Qe(
    "platform-logger",
    (e) => new xu(e),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  )), Tt(new Qe(
    "heartbeat",
    (e) => new pc(e),
    "PRIVATE"
    /* ComponentType.PRIVATE */
  )), Ee(hs, Nr, t), Ee(hs, Nr, "esm2017"), Ee("fire-js", "");
}
yc("");
var vc = "firebase", wc = "9.15.0";
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Ee(vc, wc, "app");
var Ec = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, m, Bs = Bs || {}, E = Ec || self;
function rn() {
}
function vn(t) {
  var e = typeof t;
  return e = e != "object" ? e : t ? Array.isArray(t) ? "array" : e : "null", e == "array" || e == "object" && typeof t.length == "number";
}
function wn(t) {
  var e = typeof t;
  return e == "object" && t != null || e == "function";
}
function Tc(t, e, n) {
  return t.call.apply(t.bind, arguments);
}
function bc(t, e, n) {
  if (!t) throw Error();
  if (2 < arguments.length) {
    var s = Array.prototype.slice.call(arguments, 2);
    return function() {
      var r = Array.prototype.slice.call(arguments);
      return Array.prototype.unshift.apply(r, s), t.apply(e, r);
    };
  }
  return function() {
    return t.apply(e, arguments);
  };
}
function X(t, e, n) {
  return Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? X = Tc : X = bc, X.apply(null, arguments);
}
function Ht(t, e) {
  var n = Array.prototype.slice.call(arguments, 1);
  return function() {
    var s = n.slice();
    return s.push.apply(s, arguments), t.apply(this, s);
  };
}
function G(t, e) {
  function n() {
  }
  n.prototype = e.prototype, t.X = e.prototype, t.prototype = new n(), t.prototype.constructor = t, t.Wb = function(s, r, i) {
    for (var o = Array(arguments.length - 2), a = 2; a < arguments.length; a++) o[a - 2] = arguments[a];
    return e.prototype[r].apply(s, o);
  };
}
function Se() {
  this.s = this.s, this.o = this.o;
}
var Cc = 0;
Se.prototype.s = !1;
Se.prototype.na = function() {
  !this.s && (this.s = !0, this.M(), Cc != 0);
};
Se.prototype.M = function() {
  if (this.o) for (; this.o.length; ) this.o.shift()();
};
const Ki = Array.prototype.indexOf ? function(t, e) {
  return Array.prototype.indexOf.call(t, e, void 0);
} : function(t, e) {
  if (typeof t == "string") return typeof e != "string" || e.length != 1 ? -1 : t.indexOf(e, 0);
  for (let n = 0; n < t.length; n++) if (n in t && t[n] === e) return n;
  return -1;
};
function Vs(t) {
  const e = t.length;
  if (0 < e) {
    const n = Array(e);
    for (let s = 0; s < e; s++) n[s] = t[s];
    return n;
  }
  return [];
}
function Mr(t, e) {
  for (let n = 1; n < arguments.length; n++) {
    const s = arguments[n];
    if (vn(s)) {
      const r = t.length || 0, i = s.length || 0;
      t.length = r + i;
      for (let o = 0; o < i; o++) t[r + o] = s[o];
    } else t.push(s);
  }
}
function Y(t, e) {
  this.type = t, this.g = this.target = e, this.defaultPrevented = !1;
}
Y.prototype.h = function() {
  this.defaultPrevented = !0;
};
var Sc = function() {
  if (!E.addEventListener || !Object.defineProperty) return !1;
  var t = !1, e = Object.defineProperty({}, "passive", { get: function() {
    t = !0;
  } });
  try {
    E.addEventListener("test", rn, e), E.removeEventListener("test", rn, e);
  } catch {
  }
  return t;
}();
function on(t) {
  return /^[\s\xa0]*$/.test(t);
}
var Pr = String.prototype.trim ? function(t) {
  return t.trim();
} : function(t) {
  return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(t)[1];
};
function Qn(t, e) {
  return t < e ? -1 : t > e ? 1 : 0;
}
function En() {
  var t = E.navigator;
  return t && (t = t.userAgent) ? t : "";
}
function ae(t) {
  return En().indexOf(t) != -1;
}
function $s(t) {
  return $s[" "](t), t;
}
$s[" "] = rn;
function Ic(t) {
  var e = Dc;
  return Object.prototype.hasOwnProperty.call(e, 9) ? e[9] : e[9] = t(9);
}
var _c = ae("Opera"), Xe = ae("Trident") || ae("MSIE"), zi = ae("Edge"), fs = zi || Xe, Gi = ae("Gecko") && !(En().toLowerCase().indexOf("webkit") != -1 && !ae("Edge")) && !(ae("Trident") || ae("MSIE")) && !ae("Edge"), Ac = En().toLowerCase().indexOf("webkit") != -1 && !ae("Edge");
function Wi() {
  var t = E.document;
  return t ? t.documentMode : void 0;
}
var an;
e: {
  var Xn = "", Yn = function() {
    var t = En();
    if (Gi) return /rv:([^\);]+)(\)|;)/.exec(t);
    if (zi) return /Edge\/([\d\.]+)/.exec(t);
    if (Xe) return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(t);
    if (Ac) return /WebKit\/(\S+)/.exec(t);
    if (_c) return /(?:Version)[ \/]?(\S+)/.exec(t);
  }();
  if (Yn && (Xn = Yn ? Yn[1] : ""), Xe) {
    var Jn = Wi();
    if (Jn != null && Jn > parseFloat(Xn)) {
      an = String(Jn);
      break e;
    }
  }
  an = Xn;
}
var Dc = {};
function kc() {
  return Ic(function() {
    let t = 0;
    const e = Pr(String(an)).split("."), n = Pr("9").split("."), s = Math.max(e.length, n.length);
    for (let o = 0; t == 0 && o < s; o++) {
      var r = e[o] || "", i = n[o] || "";
      do {
        if (r = /(\d*)(\D*)(.*)/.exec(r) || ["", "", "", ""], i = /(\d*)(\D*)(.*)/.exec(i) || ["", "", "", ""], r[0].length == 0 && i[0].length == 0) break;
        t = Qn(r[1].length == 0 ? 0 : parseInt(r[1], 10), i[1].length == 0 ? 0 : parseInt(i[1], 10)) || Qn(r[2].length == 0, i[2].length == 0) || Qn(r[2], i[2]), r = r[3], i = i[3];
      } while (t == 0);
    }
    return 0 <= t;
  });
}
var ps;
if (E.document && Xe) {
  var Fr = Wi();
  ps = Fr || parseInt(an, 10) || void 0;
} else ps = void 0;
var Rc = ps;
function Ct(t, e) {
  if (Y.call(this, t ? t.type : ""), this.relatedTarget = this.g = this.target = null, this.button = this.screenY = this.screenX = this.clientY = this.clientX = 0, this.key = "", this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1, this.state = null, this.pointerId = 0, this.pointerType = "", this.i = null, t) {
    var n = this.type = t.type, s = t.changedTouches && t.changedTouches.length ? t.changedTouches[0] : null;
    if (this.target = t.target || t.srcElement, this.g = e, e = t.relatedTarget) {
      if (Gi) {
        e: {
          try {
            $s(e.nodeName);
            var r = !0;
            break e;
          } catch {
          }
          r = !1;
        }
        r || (e = null);
      }
    } else n == "mouseover" ? e = t.fromElement : n == "mouseout" && (e = t.toElement);
    this.relatedTarget = e, s ? (this.clientX = s.clientX !== void 0 ? s.clientX : s.pageX, this.clientY = s.clientY !== void 0 ? s.clientY : s.pageY, this.screenX = s.screenX || 0, this.screenY = s.screenY || 0) : (this.clientX = t.clientX !== void 0 ? t.clientX : t.pageX, this.clientY = t.clientY !== void 0 ? t.clientY : t.pageY, this.screenX = t.screenX || 0, this.screenY = t.screenY || 0), this.button = t.button, this.key = t.key || "", this.ctrlKey = t.ctrlKey, this.altKey = t.altKey, this.shiftKey = t.shiftKey, this.metaKey = t.metaKey, this.pointerId = t.pointerId || 0, this.pointerType = typeof t.pointerType == "string" ? t.pointerType : Nc[t.pointerType] || "", this.state = t.state, this.i = t, t.defaultPrevented && Ct.X.h.call(this);
  }
}
G(Ct, Y);
var Nc = { 2: "touch", 3: "pen", 4: "mouse" };
Ct.prototype.h = function() {
  Ct.X.h.call(this);
  var t = this.i;
  t.preventDefault ? t.preventDefault() : t.returnValue = !1;
};
var Tn = "closure_listenable_" + (1e6 * Math.random() | 0), xc = 0;
function Oc(t, e, n, s, r) {
  this.listener = t, this.proxy = null, this.src = e, this.type = n, this.capture = !!s, this.ha = r, this.key = ++xc, this.ba = this.ea = !1;
}
function bn(t) {
  t.ba = !0, t.listener = null, t.proxy = null, t.src = null, t.ha = null;
}
function qs(t, e, n) {
  for (const s in t) e.call(n, t[s], s, t);
}
function Qi(t) {
  const e = {};
  for (const n in t) e[n] = t[n];
  return e;
}
const Ur = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
function Xi(t, e) {
  let n, s;
  for (let r = 1; r < arguments.length; r++) {
    s = arguments[r];
    for (n in s) t[n] = s[n];
    for (let i = 0; i < Ur.length; i++) n = Ur[i], Object.prototype.hasOwnProperty.call(s, n) && (t[n] = s[n]);
  }
}
function Cn(t) {
  this.src = t, this.g = {}, this.h = 0;
}
Cn.prototype.add = function(t, e, n, s, r) {
  var i = t.toString();
  t = this.g[i], t || (t = this.g[i] = [], this.h++);
  var o = ms(t, e, s, r);
  return -1 < o ? (e = t[o], n || (e.ea = !1)) : (e = new Oc(e, this.src, i, !!s, r), e.ea = n, t.push(e)), e;
};
function gs(t, e) {
  var n = e.type;
  if (n in t.g) {
    var s = t.g[n], r = Ki(s, e), i;
    (i = 0 <= r) && Array.prototype.splice.call(s, r, 1), i && (bn(e), t.g[n].length == 0 && (delete t.g[n], t.h--));
  }
}
function ms(t, e, n, s) {
  for (var r = 0; r < t.length; ++r) {
    var i = t[r];
    if (!i.ba && i.listener == e && i.capture == !!n && i.ha == s) return r;
  }
  return -1;
}
var js = "closure_lm_" + (1e6 * Math.random() | 0), Zn = {};
function Yi(t, e, n, s, r) {
  if (Array.isArray(e)) {
    for (var i = 0; i < e.length; i++) Yi(t, e[i], n, s, r);
    return null;
  }
  return n = eo(n), t && t[Tn] ? t.N(e, n, wn(s) ? !!s.capture : !1, r) : Lc(t, e, n, !1, s, r);
}
function Lc(t, e, n, s, r, i) {
  if (!e) throw Error("Invalid event type");
  var o = wn(r) ? !!r.capture : !!r, a = Ks(t);
  if (a || (t[js] = a = new Cn(t)), n = a.add(e, n, s, o, i), n.proxy) return n;
  if (s = Mc(), n.proxy = s, s.src = t, s.listener = n, t.addEventListener) Sc || (r = o), r === void 0 && (r = !1), t.addEventListener(e.toString(), s, r);
  else if (t.attachEvent) t.attachEvent(Zi(e.toString()), s);
  else if (t.addListener && t.removeListener) t.addListener(s);
  else throw Error("addEventListener and attachEvent are unavailable.");
  return n;
}
function Mc() {
  function t(n) {
    return e.call(t.src, t.listener, n);
  }
  const e = Pc;
  return t;
}
function Ji(t, e, n, s, r) {
  if (Array.isArray(e)) for (var i = 0; i < e.length; i++) Ji(t, e[i], n, s, r);
  else s = wn(s) ? !!s.capture : !!s, n = eo(n), t && t[Tn] ? (t = t.i, e = String(e).toString(), e in t.g && (i = t.g[e], n = ms(i, n, s, r), -1 < n && (bn(i[n]), Array.prototype.splice.call(i, n, 1), i.length == 0 && (delete t.g[e], t.h--)))) : t && (t = Ks(t)) && (e = t.g[e.toString()], t = -1, e && (t = ms(e, n, s, r)), (n = -1 < t ? e[t] : null) && Hs(n));
}
function Hs(t) {
  if (typeof t != "number" && t && !t.ba) {
    var e = t.src;
    if (e && e[Tn]) gs(e.i, t);
    else {
      var n = t.type, s = t.proxy;
      e.removeEventListener ? e.removeEventListener(n, s, t.capture) : e.detachEvent ? e.detachEvent(Zi(n), s) : e.addListener && e.removeListener && e.removeListener(s), (n = Ks(e)) ? (gs(n, t), n.h == 0 && (n.src = null, e[js] = null)) : bn(t);
    }
  }
}
function Zi(t) {
  return t in Zn ? Zn[t] : Zn[t] = "on" + t;
}
function Pc(t, e) {
  if (t.ba) t = !0;
  else {
    e = new Ct(e, this);
    var n = t.listener, s = t.ha || t.src;
    t.ea && Hs(t), t = n.call(s, e);
  }
  return t;
}
function Ks(t) {
  return t = t[js], t instanceof Cn ? t : null;
}
var es = "__closure_events_fn_" + (1e9 * Math.random() >>> 0);
function eo(t) {
  return typeof t == "function" ? t : (t[es] || (t[es] = function(e) {
    return t.handleEvent(e);
  }), t[es]);
}
function j() {
  Se.call(this), this.i = new Cn(this), this.P = this, this.I = null;
}
G(j, Se);
j.prototype[Tn] = !0;
j.prototype.removeEventListener = function(t, e, n, s) {
  Ji(this, t, e, n, s);
};
function K(t, e) {
  var n, s = t.I;
  if (s) for (n = []; s; s = s.I) n.push(s);
  if (t = t.P, s = e.type || e, typeof e == "string") e = new Y(e, t);
  else if (e instanceof Y) e.target = e.target || t;
  else {
    var r = e;
    e = new Y(s, t), Xi(e, r);
  }
  if (r = !0, n) for (var i = n.length - 1; 0 <= i; i--) {
    var o = e.g = n[i];
    r = Kt(o, s, !0, e) && r;
  }
  if (o = e.g = t, r = Kt(o, s, !0, e) && r, r = Kt(o, s, !1, e) && r, n) for (i = 0; i < n.length; i++) o = e.g = n[i], r = Kt(o, s, !1, e) && r;
}
j.prototype.M = function() {
  if (j.X.M.call(this), this.i) {
    var t = this.i, e;
    for (e in t.g) {
      for (var n = t.g[e], s = 0; s < n.length; s++) bn(n[s]);
      delete t.g[e], t.h--;
    }
  }
  this.I = null;
};
j.prototype.N = function(t, e, n, s) {
  return this.i.add(String(t), e, !1, n, s);
};
j.prototype.O = function(t, e, n, s) {
  return this.i.add(String(t), e, !0, n, s);
};
function Kt(t, e, n, s) {
  if (e = t.i.g[String(e)], !e) return !0;
  e = e.concat();
  for (var r = !0, i = 0; i < e.length; ++i) {
    var o = e[i];
    if (o && !o.ba && o.capture == n) {
      var a = o.listener, u = o.ha || o.src;
      o.ea && gs(t.i, o), r = a.call(u, s) !== !1 && r;
    }
  }
  return r && !s.defaultPrevented;
}
var zs = E.JSON.stringify;
function Fc() {
  var t = so;
  let e = null;
  return t.g && (e = t.g, t.g = t.g.next, t.g || (t.h = null), e.next = null), e;
}
class Uc {
  constructor() {
    this.h = this.g = null;
  }
  add(e, n) {
    const s = to.get();
    s.set(e, n), this.h ? this.h.next = s : this.g = s, this.h = s;
  }
}
var to = new class {
  constructor(t, e) {
    this.i = t, this.j = e, this.h = 0, this.g = null;
  }
  get() {
    let t;
    return 0 < this.h ? (this.h--, t = this.g, this.g = t.next, t.next = null) : t = this.i(), t;
  }
}(() => new Bc(), (t) => t.reset());
class Bc {
  constructor() {
    this.next = this.g = this.h = null;
  }
  set(e, n) {
    this.h = e, this.g = n, this.next = null;
  }
  reset() {
    this.next = this.g = this.h = null;
  }
}
function Vc(t) {
  E.setTimeout(() => {
    throw t;
  }, 0);
}
function no(t, e) {
  ys || $c(), vs || (ys(), vs = !0), so.add(t, e);
}
var ys;
function $c() {
  var t = E.Promise.resolve(void 0);
  ys = function() {
    t.then(qc);
  };
}
var vs = !1, so = new Uc();
function qc() {
  for (var t; t = Fc(); ) {
    try {
      t.h.call(t.g);
    } catch (n) {
      Vc(n);
    }
    var e = to;
    e.j(t), 100 > e.h && (e.h++, t.next = e.g, e.g = t);
  }
  vs = !1;
}
function Sn(t, e) {
  j.call(this), this.h = t || 1, this.g = e || E, this.j = X(this.lb, this), this.l = Date.now();
}
G(Sn, j);
m = Sn.prototype;
m.ca = !1;
m.R = null;
m.lb = function() {
  if (this.ca) {
    var t = Date.now() - this.l;
    0 < t && t < 0.8 * this.h ? this.R = this.g.setTimeout(this.j, this.h - t) : (this.R && (this.g.clearTimeout(this.R), this.R = null), K(this, "tick"), this.ca && (Gs(this), this.start()));
  }
};
m.start = function() {
  this.ca = !0, this.R || (this.R = this.g.setTimeout(this.j, this.h), this.l = Date.now());
};
function Gs(t) {
  t.ca = !1, t.R && (t.g.clearTimeout(t.R), t.R = null);
}
m.M = function() {
  Sn.X.M.call(this), Gs(this), delete this.g;
};
function Ws(t, e, n) {
  if (typeof t == "function") n && (t = X(t, n));
  else if (t && typeof t.handleEvent == "function") t = X(t.handleEvent, t);
  else throw Error("Invalid listener argument");
  return 2147483647 < Number(e) ? -1 : E.setTimeout(t, e || 0);
}
function ro(t) {
  t.g = Ws(() => {
    t.g = null, t.i && (t.i = !1, ro(t));
  }, t.j);
  const e = t.h;
  t.h = null, t.m.apply(null, e);
}
class jc extends Se {
  constructor(e, n) {
    super(), this.m = e, this.j = n, this.h = null, this.i = !1, this.g = null;
  }
  l(e) {
    this.h = arguments, this.g ? this.i = !0 : ro(this);
  }
  M() {
    super.M(), this.g && (E.clearTimeout(this.g), this.g = null, this.i = !1, this.h = null);
  }
}
function St(t) {
  Se.call(this), this.h = t, this.g = {};
}
G(St, Se);
var Br = [];
function io(t, e, n, s) {
  Array.isArray(n) || (n && (Br[0] = n.toString()), n = Br);
  for (var r = 0; r < n.length; r++) {
    var i = Yi(e, n[r], s || t.handleEvent, !1, t.h || t);
    if (!i) break;
    t.g[i.key] = i;
  }
}
function oo(t) {
  qs(t.g, function(e, n) {
    this.g.hasOwnProperty(n) && Hs(e);
  }, t), t.g = {};
}
St.prototype.M = function() {
  St.X.M.call(this), oo(this);
};
St.prototype.handleEvent = function() {
  throw Error("EventHandler.handleEvent not implemented");
};
function In() {
  this.g = !0;
}
In.prototype.Aa = function() {
  this.g = !1;
};
function Hc(t, e, n, s, r, i) {
  t.info(function() {
    if (t.g) if (i)
      for (var o = "", a = i.split("&"), u = 0; u < a.length; u++) {
        var c = a[u].split("=");
        if (1 < c.length) {
          var h = c[0];
          c = c[1];
          var l = h.split("_");
          o = 2 <= l.length && l[1] == "type" ? o + (h + "=" + c + "&") : o + (h + "=redacted&");
        }
      }
    else o = null;
    else o = i;
    return "XMLHTTP REQ (" + s + ") [attempt " + r + "]: " + e + `
` + n + `
` + o;
  });
}
function Kc(t, e, n, s, r, i, o) {
  t.info(function() {
    return "XMLHTTP RESP (" + s + ") [ attempt " + r + "]: " + e + `
` + n + `
` + i + " " + o;
  });
}
function He(t, e, n, s) {
  t.info(function() {
    return "XMLHTTP TEXT (" + e + "): " + Gc(t, n) + (s ? " " + s : "");
  });
}
function zc(t, e) {
  t.info(function() {
    return "TIMEOUT: " + e;
  });
}
In.prototype.info = function() {
};
function Gc(t, e) {
  if (!t.g) return e;
  if (!e) return null;
  try {
    var n = JSON.parse(e);
    if (n) {
      for (t = 0; t < n.length; t++) if (Array.isArray(n[t])) {
        var s = n[t];
        if (!(2 > s.length)) {
          var r = s[1];
          if (Array.isArray(r) && !(1 > r.length)) {
            var i = r[0];
            if (i != "noop" && i != "stop" && i != "close") for (var o = 1; o < r.length; o++) r[o] = "";
          }
        }
      }
    }
    return zs(n);
  } catch {
    return e;
  }
}
var $e = {}, Vr = null;
function _n() {
  return Vr = Vr || new j();
}
$e.Pa = "serverreachability";
function ao(t) {
  Y.call(this, $e.Pa, t);
}
G(ao, Y);
function It(t) {
  const e = _n();
  K(e, new ao(e));
}
$e.STAT_EVENT = "statevent";
function uo(t, e) {
  Y.call(this, $e.STAT_EVENT, t), this.stat = e;
}
G(uo, Y);
function te(t) {
  const e = _n();
  K(e, new uo(e, t));
}
$e.Qa = "timingevent";
function co(t, e) {
  Y.call(this, $e.Qa, t), this.size = e;
}
G(co, Y);
function xt(t, e) {
  if (typeof t != "function") throw Error("Fn must not be null and must be a function");
  return E.setTimeout(function() {
    t();
  }, e);
}
var An = { NO_ERROR: 0, mb: 1, zb: 2, yb: 3, tb: 4, xb: 5, Ab: 6, Ma: 7, TIMEOUT: 8, Db: 9 }, ho = { rb: "complete", Nb: "success", Na: "error", Ma: "abort", Fb: "ready", Gb: "readystatechange", TIMEOUT: "timeout", Bb: "incrementaldata", Eb: "progress", ub: "downloadprogress", Vb: "uploadprogress" };
function Qs() {
}
Qs.prototype.h = null;
function $r(t) {
  return t.h || (t.h = t.i());
}
function lo() {
}
var Ot = { OPEN: "a", qb: "b", Na: "c", Cb: "d" };
function Xs() {
  Y.call(this, "d");
}
G(Xs, Y);
function Ys() {
  Y.call(this, "c");
}
G(Ys, Y);
var ws;
function Dn() {
}
G(Dn, Qs);
Dn.prototype.g = function() {
  return new XMLHttpRequest();
};
Dn.prototype.i = function() {
  return {};
};
ws = new Dn();
function Lt(t, e, n, s) {
  this.l = t, this.j = e, this.m = n, this.U = s || 1, this.S = new St(this), this.O = Wc, t = fs ? 125 : void 0, this.T = new Sn(t), this.H = null, this.i = !1, this.s = this.A = this.v = this.K = this.F = this.V = this.B = null, this.D = [], this.g = null, this.C = 0, this.o = this.u = null, this.Y = -1, this.I = !1, this.N = 0, this.L = null, this.$ = this.J = this.Z = this.P = !1, this.h = new fo();
}
function fo() {
  this.i = null, this.g = "", this.h = !1;
}
var Wc = 45e3, Es = {}, un = {};
m = Lt.prototype;
m.setTimeout = function(t) {
  this.O = t;
};
function Ts(t, e, n) {
  t.K = 1, t.v = Rn(pe(e)), t.s = n, t.P = !0, po(t, null);
}
function po(t, e) {
  t.F = Date.now(), Mt(t), t.A = pe(t.v);
  var n = t.A, s = t.U;
  Array.isArray(s) || (s = [String(s)]), bo(n.i, "t", s), t.C = 0, n = t.l.H, t.h = new fo(), t.g = jo(t.l, n ? e : null, !t.s), 0 < t.N && (t.L = new jc(X(t.La, t, t.g), t.N)), io(t.S, t.g, "readystatechange", t.ib), e = t.H ? Qi(t.H) : {}, t.s ? (t.u || (t.u = "POST"), e["Content-Type"] = "application/x-www-form-urlencoded", t.g.da(t.A, t.u, t.s, e)) : (t.u = "GET", t.g.da(t.A, t.u, null, e)), It(), Hc(t.j, t.u, t.A, t.m, t.U, t.s);
}
m.ib = function(t) {
  t = t.target;
  const e = this.L;
  e && fe(t) == 3 ? e.l() : this.La(t);
};
m.La = function(t) {
  try {
    if (t == this.g) e: {
      const h = fe(this.g);
      var e = this.g.Ea();
      const l = this.g.aa();
      if (!(3 > h) && (h != 3 || fs || this.g && (this.h.h || this.g.fa() || Kr(this.g)))) {
        this.I || h != 4 || e == 7 || (e == 8 || 0 >= l ? It(3) : It(2)), kn(this);
        var n = this.g.aa();
        this.Y = n;
        t: if (go(this)) {
          var s = Kr(this.g);
          t = "";
          var r = s.length, i = fe(this.g) == 4;
          if (!this.h.i) {
            if (typeof TextDecoder > "u") {
              Ae(this), gt(this);
              var o = "";
              break t;
            }
            this.h.i = new E.TextDecoder();
          }
          for (e = 0; e < r; e++) this.h.h = !0, t += this.h.i.decode(s[e], { stream: i && e == r - 1 });
          s.splice(
            0,
            r
          ), this.h.g += t, this.C = 0, o = this.h.g;
        } else o = this.g.fa();
        if (this.i = n == 200, Kc(this.j, this.u, this.A, this.m, this.U, h, n), this.i) {
          if (this.Z && !this.J) {
            t: {
              if (this.g) {
                var a, u = this.g;
                if ((a = u.g ? u.g.getResponseHeader("X-HTTP-Initial-Response") : null) && !on(a)) {
                  var c = a;
                  break t;
                }
              }
              c = null;
            }
            if (n = c) He(this.j, this.m, n, "Initial handshake response via X-HTTP-Initial-Response"), this.J = !0, bs(this, n);
            else {
              this.i = !1, this.o = 3, te(12), Ae(this), gt(this);
              break e;
            }
          }
          this.P ? (mo(this, h, o), fs && this.i && h == 3 && (io(this.S, this.T, "tick", this.hb), this.T.start())) : (He(this.j, this.m, o, null), bs(this, o)), h == 4 && Ae(this), this.i && !this.I && (h == 4 ? Bo(this.l, this) : (this.i = !1, Mt(this)));
        } else n == 400 && 0 < o.indexOf("Unknown SID") ? (this.o = 3, te(12)) : (this.o = 0, te(13)), Ae(this), gt(this);
      }
    }
  } catch {
  } finally {
  }
};
function go(t) {
  return t.g ? t.u == "GET" && t.K != 2 && t.l.Da : !1;
}
function mo(t, e, n) {
  let s = !0, r;
  for (; !t.I && t.C < n.length; ) if (r = Qc(t, n), r == un) {
    e == 4 && (t.o = 4, te(14), s = !1), He(t.j, t.m, null, "[Incomplete Response]");
    break;
  } else if (r == Es) {
    t.o = 4, te(15), He(t.j, t.m, n, "[Invalid Chunk]"), s = !1;
    break;
  } else He(t.j, t.m, r, null), bs(t, r);
  go(t) && r != un && r != Es && (t.h.g = "", t.C = 0), e != 4 || n.length != 0 || t.h.h || (t.o = 1, te(16), s = !1), t.i = t.i && s, s ? 0 < n.length && !t.$ && (t.$ = !0, e = t.l, e.g == t && e.$ && !e.K && (e.j.info("Great, no buffering proxy detected. Bytes received: " + n.length), rr(e), e.K = !0, te(11))) : (He(
    t.j,
    t.m,
    n,
    "[Invalid Chunked Response]"
  ), Ae(t), gt(t));
}
m.hb = function() {
  if (this.g) {
    var t = fe(this.g), e = this.g.fa();
    this.C < e.length && (kn(this), mo(this, t, e), this.i && t != 4 && Mt(this));
  }
};
function Qc(t, e) {
  var n = t.C, s = e.indexOf(`
`, n);
  return s == -1 ? un : (n = Number(e.substring(n, s)), isNaN(n) ? Es : (s += 1, s + n > e.length ? un : (e = e.substr(s, n), t.C = s + n, e)));
}
m.cancel = function() {
  this.I = !0, Ae(this);
};
function Mt(t) {
  t.V = Date.now() + t.O, yo(t, t.O);
}
function yo(t, e) {
  if (t.B != null) throw Error("WatchDog timer not null");
  t.B = xt(X(t.gb, t), e);
}
function kn(t) {
  t.B && (E.clearTimeout(t.B), t.B = null);
}
m.gb = function() {
  this.B = null;
  const t = Date.now();
  0 <= t - this.V ? (zc(this.j, this.A), this.K != 2 && (It(), te(17)), Ae(this), this.o = 2, gt(this)) : yo(this, this.V - t);
};
function gt(t) {
  t.l.G == 0 || t.I || Bo(t.l, t);
}
function Ae(t) {
  kn(t);
  var e = t.L;
  e && typeof e.na == "function" && e.na(), t.L = null, Gs(t.T), oo(t.S), t.g && (e = t.g, t.g = null, e.abort(), e.na());
}
function bs(t, e) {
  try {
    var n = t.l;
    if (n.G != 0 && (n.g == t || Cs(n.h, t))) {
      if (!t.J && Cs(n.h, t) && n.G == 3) {
        try {
          var s = n.Fa.g.parse(e);
        } catch {
          s = null;
        }
        if (Array.isArray(s) && s.length == 3) {
          var r = s;
          if (r[0] == 0) {
            e:
              if (!n.u) {
                if (n.g) if (n.g.F + 3e3 < t.F) ln(n), On(n);
                else break e;
                sr(n), te(18);
              }
          } else n.Ba = r[1], 0 < n.Ba - n.T && 37500 > r[2] && n.L && n.A == 0 && !n.v && (n.v = xt(X(n.cb, n), 6e3));
          if (1 >= Io(n.h) && n.ja) {
            try {
              n.ja();
            } catch {
            }
            n.ja = void 0;
          }
        } else De(n, 11);
      } else if ((t.J || n.g == t) && ln(n), !on(e)) for (r = n.Fa.g.parse(e), e = 0; e < r.length; e++) {
        let c = r[e];
        if (n.T = c[0], c = c[1], n.G == 2) if (c[0] == "c") {
          n.I = c[1], n.ka = c[2];
          const h = c[3];
          h != null && (n.ma = h, n.j.info("VER=" + n.ma));
          const l = c[4];
          l != null && (n.Ca = l, n.j.info("SVER=" + n.Ca));
          const f = c[5];
          f != null && typeof f == "number" && 0 < f && (s = 1.5 * f, n.J = s, n.j.info("backChannelRequestTimeoutMs_=" + s)), s = n;
          const g = t.g;
          if (g) {
            const T = g.g ? g.g.getResponseHeader("X-Client-Wire-Protocol") : null;
            if (T) {
              var i = s.h;
              i.g || T.indexOf("spdy") == -1 && T.indexOf("quic") == -1 && T.indexOf("h2") == -1 || (i.j = i.l, i.g = /* @__PURE__ */ new Set(), i.h && (Js(i, i.h), i.h = null));
            }
            if (s.D) {
              const D = g.g ? g.g.getResponseHeader("X-HTTP-Session-Id") : null;
              D && (s.za = D, N(s.F, s.D, D));
            }
          }
          n.G = 3, n.l && n.l.xa(), n.$ && (n.P = Date.now() - t.F, n.j.info("Handshake RTT: " + n.P + "ms")), s = n;
          var o = t;
          if (s.sa = qo(s, s.H ? s.ka : null, s.V), o.J) {
            _o(s.h, o);
            var a = o, u = s.J;
            u && a.setTimeout(u), a.B && (kn(a), Mt(a)), s.g = o;
          } else Fo(s);
          0 < n.i.length && Ln(n);
        } else c[0] != "stop" && c[0] != "close" || De(n, 7);
        else n.G == 3 && (c[0] == "stop" || c[0] == "close" ? c[0] == "stop" ? De(n, 7) : nr(n) : c[0] != "noop" && n.l && n.l.wa(c), n.A = 0);
      }
    }
    It(4);
  } catch {
  }
}
function Xc(t) {
  if (t.W && typeof t.W == "function") return t.W();
  if (typeof Map < "u" && t instanceof Map || typeof Set < "u" && t instanceof Set) return Array.from(t.values());
  if (typeof t == "string") return t.split("");
  if (vn(t)) {
    for (var e = [], n = t.length, s = 0; s < n; s++) e.push(t[s]);
    return e;
  }
  e = [], n = 0;
  for (s in t) e[n++] = t[s];
  return e;
}
function Yc(t) {
  if (t.oa && typeof t.oa == "function") return t.oa();
  if (!t.W || typeof t.W != "function") {
    if (typeof Map < "u" && t instanceof Map) return Array.from(t.keys());
    if (!(typeof Set < "u" && t instanceof Set)) {
      if (vn(t) || typeof t == "string") {
        var e = [];
        t = t.length;
        for (var n = 0; n < t; n++) e.push(n);
        return e;
      }
      e = [], n = 0;
      for (const s in t) e[n++] = s;
      return e;
    }
  }
}
function vo(t, e) {
  if (t.forEach && typeof t.forEach == "function") t.forEach(e, void 0);
  else if (vn(t) || typeof t == "string") Array.prototype.forEach.call(t, e, void 0);
  else for (var n = Yc(t), s = Xc(t), r = s.length, i = 0; i < r; i++) e.call(void 0, s[i], n && n[i], t);
}
var wo = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");
function Jc(t, e) {
  if (t) {
    t = t.split("&");
    for (var n = 0; n < t.length; n++) {
      var s = t[n].indexOf("="), r = null;
      if (0 <= s) {
        var i = t[n].substring(0, s);
        r = t[n].substring(s + 1);
      } else i = t[n];
      e(i, r ? decodeURIComponent(r.replace(/\+/g, " ")) : "");
    }
  }
}
function Re(t, e) {
  if (this.g = this.s = this.j = "", this.m = null, this.o = this.l = "", this.h = !1, t instanceof Re) {
    this.h = e !== void 0 ? e : t.h, cn(this, t.j), this.s = t.s, this.g = t.g, hn(this, t.m), this.l = t.l, e = t.i;
    var n = new _t();
    n.i = e.i, e.g && (n.g = new Map(e.g), n.h = e.h), qr(this, n), this.o = t.o;
  } else t && (n = String(t).match(wo)) ? (this.h = !!e, cn(this, n[1] || "", !0), this.s = dt(n[2] || ""), this.g = dt(n[3] || "", !0), hn(this, n[4]), this.l = dt(n[5] || "", !0), qr(this, n[6] || "", !0), this.o = dt(n[7] || "")) : (this.h = !!e, this.i = new _t(null, this.h));
}
Re.prototype.toString = function() {
  var t = [], e = this.j;
  e && t.push(ft(e, jr, !0), ":");
  var n = this.g;
  return (n || e == "file") && (t.push("//"), (e = this.s) && t.push(ft(e, jr, !0), "@"), t.push(encodeURIComponent(String(n)).replace(/%25([0-9a-fA-F]{2})/g, "%$1")), n = this.m, n != null && t.push(":", String(n))), (n = this.l) && (this.g && n.charAt(0) != "/" && t.push("/"), t.push(ft(n, n.charAt(0) == "/" ? th : eh, !0))), (n = this.i.toString()) && t.push("?", n), (n = this.o) && t.push("#", ft(n, sh)), t.join("");
};
function pe(t) {
  return new Re(t);
}
function cn(t, e, n) {
  t.j = n ? dt(e, !0) : e, t.j && (t.j = t.j.replace(/:$/, ""));
}
function hn(t, e) {
  if (e) {
    if (e = Number(e), isNaN(e) || 0 > e) throw Error("Bad port number " + e);
    t.m = e;
  } else t.m = null;
}
function qr(t, e, n) {
  e instanceof _t ? (t.i = e, rh(t.i, t.h)) : (n || (e = ft(e, nh)), t.i = new _t(e, t.h));
}
function N(t, e, n) {
  t.i.set(e, n);
}
function Rn(t) {
  return N(t, "zx", Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ Date.now()).toString(36)), t;
}
function dt(t, e) {
  return t ? e ? decodeURI(t.replace(/%25/g, "%2525")) : decodeURIComponent(t) : "";
}
function ft(t, e, n) {
  return typeof t == "string" ? (t = encodeURI(t).replace(e, Zc), n && (t = t.replace(/%25([0-9a-fA-F]{2})/g, "%$1")), t) : null;
}
function Zc(t) {
  return t = t.charCodeAt(0), "%" + (t >> 4 & 15).toString(16) + (t & 15).toString(16);
}
var jr = /[#\/\?@]/g, eh = /[#\?:]/g, th = /[#\?]/g, nh = /[#\?@]/g, sh = /#/g;
function _t(t, e) {
  this.h = this.g = null, this.i = t || null, this.j = !!e;
}
function Ie(t) {
  t.g || (t.g = /* @__PURE__ */ new Map(), t.h = 0, t.i && Jc(t.i, function(e, n) {
    t.add(decodeURIComponent(e.replace(/\+/g, " ")), n);
  }));
}
m = _t.prototype;
m.add = function(t, e) {
  Ie(this), this.i = null, t = st(this, t);
  var n = this.g.get(t);
  return n || this.g.set(t, n = []), n.push(e), this.h += 1, this;
};
function Eo(t, e) {
  Ie(t), e = st(t, e), t.g.has(e) && (t.i = null, t.h -= t.g.get(e).length, t.g.delete(e));
}
function To(t, e) {
  return Ie(t), e = st(t, e), t.g.has(e);
}
m.forEach = function(t, e) {
  Ie(this), this.g.forEach(function(n, s) {
    n.forEach(function(r) {
      t.call(e, r, s, this);
    }, this);
  }, this);
};
m.oa = function() {
  Ie(this);
  const t = Array.from(this.g.values()), e = Array.from(this.g.keys()), n = [];
  for (let s = 0; s < e.length; s++) {
    const r = t[s];
    for (let i = 0; i < r.length; i++) n.push(e[s]);
  }
  return n;
};
m.W = function(t) {
  Ie(this);
  let e = [];
  if (typeof t == "string") To(this, t) && (e = e.concat(this.g.get(st(this, t))));
  else {
    t = Array.from(this.g.values());
    for (let n = 0; n < t.length; n++) e = e.concat(t[n]);
  }
  return e;
};
m.set = function(t, e) {
  return Ie(this), this.i = null, t = st(this, t), To(this, t) && (this.h -= this.g.get(t).length), this.g.set(t, [e]), this.h += 1, this;
};
m.get = function(t, e) {
  return t ? (t = this.W(t), 0 < t.length ? String(t[0]) : e) : e;
};
function bo(t, e, n) {
  Eo(t, e), 0 < n.length && (t.i = null, t.g.set(st(t, e), Vs(n)), t.h += n.length);
}
m.toString = function() {
  if (this.i) return this.i;
  if (!this.g) return "";
  const t = [], e = Array.from(this.g.keys());
  for (var n = 0; n < e.length; n++) {
    var s = e[n];
    const i = encodeURIComponent(String(s)), o = this.W(s);
    for (s = 0; s < o.length; s++) {
      var r = i;
      o[s] !== "" && (r += "=" + encodeURIComponent(String(o[s]))), t.push(r);
    }
  }
  return this.i = t.join("&");
};
function st(t, e) {
  return e = String(e), t.j && (e = e.toLowerCase()), e;
}
function rh(t, e) {
  e && !t.j && (Ie(t), t.i = null, t.g.forEach(function(n, s) {
    var r = s.toLowerCase();
    s != r && (Eo(this, s), bo(this, r, n));
  }, t)), t.j = e;
}
var ih = class {
  constructor(t, e) {
    this.h = t, this.g = e;
  }
};
function Co(t) {
  this.l = t || oh, E.PerformanceNavigationTiming ? (t = E.performance.getEntriesByType("navigation"), t = 0 < t.length && (t[0].nextHopProtocol == "hq" || t[0].nextHopProtocol == "h2")) : t = !!(E.g && E.g.Ga && E.g.Ga() && E.g.Ga().$b), this.j = t ? this.l : 1, this.g = null, 1 < this.j && (this.g = /* @__PURE__ */ new Set()), this.h = null, this.i = [];
}
var oh = 10;
function So(t) {
  return t.h ? !0 : t.g ? t.g.size >= t.j : !1;
}
function Io(t) {
  return t.h ? 1 : t.g ? t.g.size : 0;
}
function Cs(t, e) {
  return t.h ? t.h == e : t.g ? t.g.has(e) : !1;
}
function Js(t, e) {
  t.g ? t.g.add(e) : t.h = e;
}
function _o(t, e) {
  t.h && t.h == e ? t.h = null : t.g && t.g.has(e) && t.g.delete(e);
}
Co.prototype.cancel = function() {
  if (this.i = Ao(this), this.h) this.h.cancel(), this.h = null;
  else if (this.g && this.g.size !== 0) {
    for (const t of this.g.values()) t.cancel();
    this.g.clear();
  }
};
function Ao(t) {
  if (t.h != null) return t.i.concat(t.h.D);
  if (t.g != null && t.g.size !== 0) {
    let e = t.i;
    for (const n of t.g.values()) e = e.concat(n.D);
    return e;
  }
  return Vs(t.i);
}
function Zs() {
}
Zs.prototype.stringify = function(t) {
  return E.JSON.stringify(t, void 0);
};
Zs.prototype.parse = function(t) {
  return E.JSON.parse(t, void 0);
};
function ah() {
  this.g = new Zs();
}
function uh(t, e, n) {
  const s = n || "";
  try {
    vo(t, function(r, i) {
      let o = r;
      wn(r) && (o = zs(r)), e.push(s + i + "=" + encodeURIComponent(o));
    });
  } catch (r) {
    throw e.push(s + "type=" + encodeURIComponent("_badmap")), r;
  }
}
function ch(t, e) {
  const n = new In();
  if (E.Image) {
    const s = new Image();
    s.onload = Ht(zt, n, s, "TestLoadImage: loaded", !0, e), s.onerror = Ht(zt, n, s, "TestLoadImage: error", !1, e), s.onabort = Ht(zt, n, s, "TestLoadImage: abort", !1, e), s.ontimeout = Ht(zt, n, s, "TestLoadImage: timeout", !1, e), E.setTimeout(function() {
      s.ontimeout && s.ontimeout();
    }, 1e4), s.src = t;
  } else e(!1);
}
function zt(t, e, n, s, r) {
  try {
    e.onload = null, e.onerror = null, e.onabort = null, e.ontimeout = null, r(s);
  } catch {
  }
}
function Pt(t) {
  this.l = t.ac || null, this.j = t.jb || !1;
}
G(Pt, Qs);
Pt.prototype.g = function() {
  return new Nn(this.l, this.j);
};
Pt.prototype.i = /* @__PURE__ */ function(t) {
  return function() {
    return t;
  };
}({});
function Nn(t, e) {
  j.call(this), this.D = t, this.u = e, this.m = void 0, this.readyState = er, this.status = 0, this.responseType = this.responseText = this.response = this.statusText = "", this.onreadystatechange = null, this.v = new Headers(), this.h = null, this.C = "GET", this.B = "", this.g = !1, this.A = this.j = this.l = null;
}
G(Nn, j);
var er = 0;
m = Nn.prototype;
m.open = function(t, e) {
  if (this.readyState != er) throw this.abort(), Error("Error reopening a connection");
  this.C = t, this.B = e, this.readyState = 1, At(this);
};
m.send = function(t) {
  if (this.readyState != 1) throw this.abort(), Error("need to call open() first. ");
  this.g = !0;
  const e = { headers: this.v, method: this.C, credentials: this.m, cache: void 0 };
  t && (e.body = t), (this.D || E).fetch(new Request(this.B, e)).then(this.Wa.bind(this), this.ga.bind(this));
};
m.abort = function() {
  this.response = this.responseText = "", this.v = new Headers(), this.status = 0, this.j && this.j.cancel("Request was aborted.").catch(() => {
  }), 1 <= this.readyState && this.g && this.readyState != 4 && (this.g = !1, Ft(this)), this.readyState = er;
};
m.Wa = function(t) {
  if (this.g && (this.l = t, this.h || (this.status = this.l.status, this.statusText = this.l.statusText, this.h = t.headers, this.readyState = 2, At(this)), this.g && (this.readyState = 3, At(this), this.g))) if (this.responseType === "arraybuffer") t.arrayBuffer().then(this.Ua.bind(this), this.ga.bind(this));
  else if (typeof E.ReadableStream < "u" && "body" in t) {
    if (this.j = t.body.getReader(), this.u) {
      if (this.responseType) throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');
      this.response = [];
    } else this.response = this.responseText = "", this.A = new TextDecoder();
    Do(this);
  } else t.text().then(this.Va.bind(this), this.ga.bind(this));
};
function Do(t) {
  t.j.read().then(t.Ta.bind(t)).catch(t.ga.bind(t));
}
m.Ta = function(t) {
  if (this.g) {
    if (this.u && t.value) this.response.push(t.value);
    else if (!this.u) {
      var e = t.value ? t.value : new Uint8Array(0);
      (e = this.A.decode(e, { stream: !t.done })) && (this.response = this.responseText += e);
    }
    t.done ? Ft(this) : At(this), this.readyState == 3 && Do(this);
  }
};
m.Va = function(t) {
  this.g && (this.response = this.responseText = t, Ft(this));
};
m.Ua = function(t) {
  this.g && (this.response = t, Ft(this));
};
m.ga = function() {
  this.g && Ft(this);
};
function Ft(t) {
  t.readyState = 4, t.l = null, t.j = null, t.A = null, At(t);
}
m.setRequestHeader = function(t, e) {
  this.v.append(t, e);
};
m.getResponseHeader = function(t) {
  return this.h && this.h.get(t.toLowerCase()) || "";
};
m.getAllResponseHeaders = function() {
  if (!this.h) return "";
  const t = [], e = this.h.entries();
  for (var n = e.next(); !n.done; ) n = n.value, t.push(n[0] + ": " + n[1]), n = e.next();
  return t.join(`\r
`);
};
function At(t) {
  t.onreadystatechange && t.onreadystatechange.call(t);
}
Object.defineProperty(Nn.prototype, "withCredentials", { get: function() {
  return this.m === "include";
}, set: function(t) {
  this.m = t ? "include" : "same-origin";
} });
var hh = E.JSON.parse;
function O(t) {
  j.call(this), this.headers = /* @__PURE__ */ new Map(), this.u = t || null, this.h = !1, this.C = this.g = null, this.H = "", this.m = 0, this.j = "", this.l = this.F = this.v = this.D = !1, this.B = 0, this.A = null, this.J = ko, this.K = this.L = !1;
}
G(O, j);
var ko = "", lh = /^https?$/i, dh = ["POST", "PUT"];
m = O.prototype;
m.Ka = function(t) {
  this.L = t;
};
m.da = function(t, e, n, s) {
  if (this.g) throw Error("[goog.net.XhrIo] Object is active with another request=" + this.H + "; newUri=" + t);
  e = e ? e.toUpperCase() : "GET", this.H = t, this.j = "", this.m = 0, this.D = !1, this.h = !0, this.g = this.u ? this.u.g() : ws.g(), this.C = this.u ? $r(this.u) : $r(ws), this.g.onreadystatechange = X(this.Ha, this);
  try {
    this.F = !0, this.g.open(e, String(t), !0), this.F = !1;
  } catch (i) {
    Hr(this, i);
    return;
  }
  if (t = n || "", n = new Map(this.headers), s) if (Object.getPrototypeOf(s) === Object.prototype) for (var r in s) n.set(r, s[r]);
  else if (typeof s.keys == "function" && typeof s.get == "function") for (const i of s.keys()) n.set(i, s.get(i));
  else throw Error("Unknown input type for opt_headers: " + String(s));
  s = Array.from(n.keys()).find((i) => i.toLowerCase() == "content-type"), r = E.FormData && t instanceof E.FormData, !(0 <= Ki(dh, e)) || s || r || n.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
  for (const [i, o] of n) this.g.setRequestHeader(i, o);
  this.J && (this.g.responseType = this.J), "withCredentials" in this.g && this.g.withCredentials !== this.L && (this.g.withCredentials = this.L);
  try {
    xo(this), 0 < this.B && ((this.K = fh(this.g)) ? (this.g.timeout = this.B, this.g.ontimeout = X(this.qa, this)) : this.A = Ws(this.qa, this.B, this)), this.v = !0, this.g.send(t), this.v = !1;
  } catch (i) {
    Hr(this, i);
  }
};
function fh(t) {
  return Xe && kc() && typeof t.timeout == "number" && t.ontimeout !== void 0;
}
m.qa = function() {
  typeof Bs < "u" && this.g && (this.j = "Timed out after " + this.B + "ms, aborting", this.m = 8, K(this, "timeout"), this.abort(8));
};
function Hr(t, e) {
  t.h = !1, t.g && (t.l = !0, t.g.abort(), t.l = !1), t.j = e, t.m = 5, Ro(t), xn(t);
}
function Ro(t) {
  t.D || (t.D = !0, K(t, "complete"), K(t, "error"));
}
m.abort = function(t) {
  this.g && this.h && (this.h = !1, this.l = !0, this.g.abort(), this.l = !1, this.m = t || 7, K(this, "complete"), K(this, "abort"), xn(this));
};
m.M = function() {
  this.g && (this.h && (this.h = !1, this.l = !0, this.g.abort(), this.l = !1), xn(this, !0)), O.X.M.call(this);
};
m.Ha = function() {
  this.s || (this.F || this.v || this.l ? No(this) : this.fb());
};
m.fb = function() {
  No(this);
};
function No(t) {
  if (t.h && typeof Bs < "u" && (!t.C[1] || fe(t) != 4 || t.aa() != 2)) {
    if (t.v && fe(t) == 4) Ws(t.Ha, 0, t);
    else if (K(t, "readystatechange"), fe(t) == 4) {
      t.h = !1;
      try {
        const a = t.aa();
        e: switch (a) {
          case 200:
          case 201:
          case 202:
          case 204:
          case 206:
          case 304:
          case 1223:
            var e = !0;
            break e;
          default:
            e = !1;
        }
        var n;
        if (!(n = e)) {
          var s;
          if (s = a === 0) {
            var r = String(t.H).match(wo)[1] || null;
            if (!r && E.self && E.self.location) {
              var i = E.self.location.protocol;
              r = i.substr(0, i.length - 1);
            }
            s = !lh.test(r ? r.toLowerCase() : "");
          }
          n = s;
        }
        if (n) K(t, "complete"), K(
          t,
          "success"
        );
        else {
          t.m = 6;
          try {
            var o = 2 < fe(t) ? t.g.statusText : "";
          } catch {
            o = "";
          }
          t.j = o + " [" + t.aa() + "]", Ro(t);
        }
      } finally {
        xn(t);
      }
    }
  }
}
function xn(t, e) {
  if (t.g) {
    xo(t);
    const n = t.g, s = t.C[0] ? rn : null;
    t.g = null, t.C = null, e || K(t, "ready");
    try {
      n.onreadystatechange = s;
    } catch {
    }
  }
}
function xo(t) {
  t.g && t.K && (t.g.ontimeout = null), t.A && (E.clearTimeout(t.A), t.A = null);
}
function fe(t) {
  return t.g ? t.g.readyState : 0;
}
m.aa = function() {
  try {
    return 2 < fe(this) ? this.g.status : -1;
  } catch {
    return -1;
  }
};
m.fa = function() {
  try {
    return this.g ? this.g.responseText : "";
  } catch {
    return "";
  }
};
m.Sa = function(t) {
  if (this.g) {
    var e = this.g.responseText;
    return t && e.indexOf(t) == 0 && (e = e.substring(t.length)), hh(e);
  }
};
function Kr(t) {
  try {
    if (!t.g) return null;
    if ("response" in t.g) return t.g.response;
    switch (t.J) {
      case ko:
      case "text":
        return t.g.responseText;
      case "arraybuffer":
        if ("mozResponseArrayBuffer" in t.g) return t.g.mozResponseArrayBuffer;
    }
    return null;
  } catch {
    return null;
  }
}
m.Ea = function() {
  return this.m;
};
m.Oa = function() {
  return typeof this.j == "string" ? this.j : String(this.j);
};
function Oo(t) {
  let e = "";
  return qs(t, function(n, s) {
    e += s, e += ":", e += n, e += `\r
`;
  }), e;
}
function tr(t, e, n) {
  e: {
    for (s in n) {
      var s = !1;
      break e;
    }
    s = !0;
  }
  s || (n = Oo(n), typeof t == "string" ? n != null && encodeURIComponent(String(n)) : N(t, e, n));
}
function ht(t, e, n) {
  return n && n.internalChannelParams && n.internalChannelParams[t] || e;
}
function Lo(t) {
  this.Ca = 0, this.i = [], this.j = new In(), this.ka = this.sa = this.F = this.V = this.g = this.za = this.D = this.ia = this.o = this.S = this.s = null, this.ab = this.U = 0, this.Za = ht("failFast", !1, t), this.L = this.v = this.u = this.m = this.l = null, this.Y = !0, this.pa = this.Ba = this.T = -1, this.Z = this.A = this.C = 0, this.Xa = ht("baseRetryDelayMs", 5e3, t), this.bb = ht("retryDelaySeedMs", 1e4, t), this.$a = ht("forwardChannelMaxRetries", 2, t), this.ta = ht("forwardChannelRequestTimeoutMs", 2e4, t), this.ra = t && t.xmlHttpFactory || void 0, this.Da = t && t.Zb || !1, this.J = void 0, this.H = t && t.supportsCrossDomainXhr || !1, this.I = "", this.h = new Co(t && t.concurrentRequestLimit), this.Fa = new ah(), this.O = t && t.fastHandshake || !1, this.N = t && t.encodeInitMessageHeaders || !1, this.O && this.N && (this.N = !1), this.Ya = t && t.Xb || !1, t && t.Aa && this.j.Aa(), t && t.forceLongPolling && (this.Y = !1), this.$ = !this.O && this.Y && t && t.detectBufferingProxy || !1, this.ja = void 0, this.P = 0, this.K = !1, this.la = this.B = null;
}
m = Lo.prototype;
m.ma = 8;
m.G = 1;
function nr(t) {
  if (Mo(t), t.G == 3) {
    var e = t.U++, n = pe(t.F);
    N(n, "SID", t.I), N(n, "RID", e), N(n, "TYPE", "terminate"), Ut(t, n), e = new Lt(t, t.j, e, void 0), e.K = 2, e.v = Rn(pe(n)), n = !1, E.navigator && E.navigator.sendBeacon && (n = E.navigator.sendBeacon(e.v.toString(), "")), !n && E.Image && (new Image().src = e.v, n = !0), n || (e.g = jo(e.l, null), e.g.da(e.v)), e.F = Date.now(), Mt(e);
  }
  $o(t);
}
function On(t) {
  t.g && (rr(t), t.g.cancel(), t.g = null);
}
function Mo(t) {
  On(t), t.u && (E.clearTimeout(t.u), t.u = null), ln(t), t.h.cancel(), t.m && (typeof t.m == "number" && E.clearTimeout(t.m), t.m = null);
}
function Ln(t) {
  So(t.h) || t.m || (t.m = !0, no(t.Ja, t), t.C = 0);
}
function ph(t, e) {
  return Io(t.h) >= t.h.j - (t.m ? 1 : 0) ? !1 : t.m ? (t.i = e.D.concat(t.i), !0) : t.G == 1 || t.G == 2 || t.C >= (t.Za ? 0 : t.$a) ? !1 : (t.m = xt(X(t.Ja, t, e), Vo(t, t.C)), t.C++, !0);
}
m.Ja = function(t) {
  if (this.m) if (this.m = null, this.G == 1) {
    if (!t) {
      this.U = Math.floor(1e5 * Math.random()), t = this.U++;
      const r = new Lt(this, this.j, t, void 0);
      let i = this.s;
      if (this.S && (i ? (i = Qi(i), Xi(i, this.S)) : i = this.S), this.o !== null || this.N || (r.H = i, i = null), this.O) e: {
        for (var e = 0, n = 0; n < this.i.length; n++) {
          t: {
            var s = this.i[n];
            if ("__data__" in s.g && (s = s.g.__data__, typeof s == "string")) {
              s = s.length;
              break t;
            }
            s = void 0;
          }
          if (s === void 0) break;
          if (e += s, 4096 < e) {
            e = n;
            break e;
          }
          if (e === 4096 || n === this.i.length - 1) {
            e = n + 1;
            break e;
          }
        }
        e = 1e3;
      }
      else e = 1e3;
      e = Po(this, r, e), n = pe(this.F), N(n, "RID", t), N(n, "CVER", 22), this.D && N(n, "X-HTTP-Session-Id", this.D), Ut(this, n), i && (this.N ? e = "headers=" + encodeURIComponent(String(Oo(i))) + "&" + e : this.o && tr(n, this.o, i)), Js(this.h, r), this.Ya && N(n, "TYPE", "init"), this.O ? (N(n, "$req", e), N(n, "SID", "null"), r.Z = !0, Ts(r, n, null)) : Ts(r, n, e), this.G = 2;
    }
  } else this.G == 3 && (t ? zr(this, t) : this.i.length == 0 || So(this.h) || zr(this));
};
function zr(t, e) {
  var n;
  e ? n = e.m : n = t.U++;
  const s = pe(t.F);
  N(s, "SID", t.I), N(s, "RID", n), N(s, "AID", t.T), Ut(t, s), t.o && t.s && tr(s, t.o, t.s), n = new Lt(t, t.j, n, t.C + 1), t.o === null && (n.H = t.s), e && (t.i = e.D.concat(t.i)), e = Po(t, n, 1e3), n.setTimeout(Math.round(0.5 * t.ta) + Math.round(0.5 * t.ta * Math.random())), Js(t.h, n), Ts(n, s, e);
}
function Ut(t, e) {
  t.ia && qs(t.ia, function(n, s) {
    N(e, s, n);
  }), t.l && vo({}, function(n, s) {
    N(e, s, n);
  });
}
function Po(t, e, n) {
  n = Math.min(t.i.length, n);
  var s = t.l ? X(t.l.Ra, t.l, t) : null;
  e: {
    var r = t.i;
    let i = -1;
    for (; ; ) {
      const o = ["count=" + n];
      i == -1 ? 0 < n ? (i = r[0].h, o.push("ofs=" + i)) : i = 0 : o.push("ofs=" + i);
      let a = !0;
      for (let u = 0; u < n; u++) {
        let c = r[u].h;
        const h = r[u].g;
        if (c -= i, 0 > c) i = Math.max(0, r[u].h - 100), a = !1;
        else try {
          uh(h, o, "req" + c + "_");
        } catch {
          s && s(h);
        }
      }
      if (a) {
        s = o.join("&");
        break e;
      }
    }
  }
  return t = t.i.splice(0, n), e.D = t, s;
}
function Fo(t) {
  t.g || t.u || (t.Z = 1, no(t.Ia, t), t.A = 0);
}
function sr(t) {
  return t.g || t.u || 3 <= t.A ? !1 : (t.Z++, t.u = xt(X(t.Ia, t), Vo(t, t.A)), t.A++, !0);
}
m.Ia = function() {
  if (this.u = null, Uo(this), this.$ && !(this.K || this.g == null || 0 >= this.P)) {
    var t = 2 * this.P;
    this.j.info("BP detection timer enabled: " + t), this.B = xt(X(this.eb, this), t);
  }
};
m.eb = function() {
  this.B && (this.B = null, this.j.info("BP detection timeout reached."), this.j.info("Buffering proxy detected and switch to long-polling!"), this.L = !1, this.K = !0, te(10), On(this), Uo(this));
};
function rr(t) {
  t.B != null && (E.clearTimeout(t.B), t.B = null);
}
function Uo(t) {
  t.g = new Lt(t, t.j, "rpc", t.Z), t.o === null && (t.g.H = t.s), t.g.N = 0;
  var e = pe(t.sa);
  N(e, "RID", "rpc"), N(e, "SID", t.I), N(e, "CI", t.L ? "0" : "1"), N(e, "AID", t.T), N(e, "TYPE", "xmlhttp"), Ut(t, e), t.o && t.s && tr(e, t.o, t.s), t.J && t.g.setTimeout(t.J);
  var n = t.g;
  t = t.ka, n.K = 1, n.v = Rn(pe(e)), n.s = null, n.P = !0, po(n, t);
}
m.cb = function() {
  this.v != null && (this.v = null, On(this), sr(this), te(19));
};
function ln(t) {
  t.v != null && (E.clearTimeout(t.v), t.v = null);
}
function Bo(t, e) {
  var n = null;
  if (t.g == e) {
    ln(t), rr(t), t.g = null;
    var s = 2;
  } else if (Cs(t.h, e)) n = e.D, _o(t.h, e), s = 1;
  else return;
  if (t.G != 0) {
    if (t.pa = e.Y, e.i) if (s == 1) {
      n = e.s ? e.s.length : 0, e = Date.now() - e.F;
      var r = t.C;
      s = _n(), K(s, new co(s, n)), Ln(t);
    } else Fo(t);
    else if (r = e.o, r == 3 || r == 0 && 0 < t.pa || !(s == 1 && ph(t, e) || s == 2 && sr(t))) switch (n && 0 < n.length && (e = t.h, e.i = e.i.concat(n)), r) {
      case 1:
        De(t, 5);
        break;
      case 4:
        De(t, 10);
        break;
      case 3:
        De(t, 6);
        break;
      default:
        De(t, 2);
    }
  }
}
function Vo(t, e) {
  let n = t.Xa + Math.floor(Math.random() * t.bb);
  return t.l || (n *= 2), n * e;
}
function De(t, e) {
  if (t.j.info("Error code " + e), e == 2) {
    var n = null;
    t.l && (n = null);
    var s = X(t.kb, t);
    n || (n = new Re("//www.google.com/images/cleardot.gif"), E.location && E.location.protocol == "http" || cn(n, "https"), Rn(n)), ch(n.toString(), s);
  } else te(2);
  t.G = 0, t.l && t.l.va(e), $o(t), Mo(t);
}
m.kb = function(t) {
  t ? (this.j.info("Successfully pinged google.com"), te(2)) : (this.j.info("Failed to ping google.com"), te(1));
};
function $o(t) {
  if (t.G = 0, t.la = [], t.l) {
    const e = Ao(t.h);
    (e.length != 0 || t.i.length != 0) && (Mr(t.la, e), Mr(t.la, t.i), t.h.i.length = 0, Vs(t.i), t.i.length = 0), t.l.ua();
  }
}
function qo(t, e, n) {
  var s = n instanceof Re ? pe(n) : new Re(n, void 0);
  if (s.g != "") e && (s.g = e + "." + s.g), hn(s, s.m);
  else {
    var r = E.location;
    s = r.protocol, e = e ? e + "." + r.hostname : r.hostname, r = +r.port;
    var i = new Re(null, void 0);
    s && cn(i, s), e && (i.g = e), r && hn(i, r), n && (i.l = n), s = i;
  }
  return n = t.D, e = t.za, n && e && N(s, n, e), N(s, "VER", t.ma), Ut(t, s), s;
}
function jo(t, e, n) {
  if (e && !t.H) throw Error("Can't create secondary domain capable XhrIo object.");
  return e = n && t.Da && !t.ra ? new O(new Pt({ jb: !0 })) : new O(t.ra), e.Ka(t.H), e;
}
function Ho() {
}
m = Ho.prototype;
m.xa = function() {
};
m.wa = function() {
};
m.va = function() {
};
m.ua = function() {
};
m.Ra = function() {
};
function dn() {
  if (Xe && !(10 <= Number(Rc))) throw Error("Environmental error: no available transport.");
}
dn.prototype.g = function(t, e) {
  return new oe(t, e);
};
function oe(t, e) {
  j.call(this), this.g = new Lo(e), this.l = t, this.h = e && e.messageUrlParams || null, t = e && e.messageHeaders || null, e && e.clientProtocolHeaderRequired && (t ? t["X-Client-Protocol"] = "webchannel" : t = { "X-Client-Protocol": "webchannel" }), this.g.s = t, t = e && e.initMessageHeaders || null, e && e.messageContentType && (t ? t["X-WebChannel-Content-Type"] = e.messageContentType : t = { "X-WebChannel-Content-Type": e.messageContentType }), e && e.ya && (t ? t["X-WebChannel-Client-Profile"] = e.ya : t = { "X-WebChannel-Client-Profile": e.ya }), this.g.S = t, (t = e && e.Yb) && !on(t) && (this.g.o = t), this.A = e && e.supportsCrossDomainXhr || !1, this.v = e && e.sendRawJson || !1, (e = e && e.httpSessionIdParam) && !on(e) && (this.g.D = e, t = this.h, t !== null && e in t && (t = this.h, e in t && delete t[e])), this.j = new rt(this);
}
G(oe, j);
oe.prototype.m = function() {
  this.g.l = this.j, this.A && (this.g.H = !0);
  var t = this.g, e = this.l, n = this.h || void 0;
  te(0), t.V = e, t.ia = n || {}, t.L = t.Y, t.F = qo(t, null, t.V), Ln(t);
};
oe.prototype.close = function() {
  nr(this.g);
};
oe.prototype.u = function(t) {
  var e = this.g;
  if (typeof t == "string") {
    var n = {};
    n.__data__ = t, t = n;
  } else this.v && (n = {}, n.__data__ = zs(t), t = n);
  e.i.push(new ih(e.ab++, t)), e.G == 3 && Ln(e);
};
oe.prototype.M = function() {
  this.g.l = null, delete this.j, nr(this.g), delete this.g, oe.X.M.call(this);
};
function Ko(t) {
  Xs.call(this);
  var e = t.__sm__;
  if (e) {
    e: {
      for (const n in e) {
        t = n;
        break e;
      }
      t = void 0;
    }
    (this.i = t) && (t = this.i, e = e !== null && t in e ? e[t] : void 0), this.data = e;
  } else this.data = t;
}
G(Ko, Xs);
function zo() {
  Ys.call(this), this.status = 1;
}
G(zo, Ys);
function rt(t) {
  this.g = t;
}
G(rt, Ho);
rt.prototype.xa = function() {
  K(this.g, "a");
};
rt.prototype.wa = function(t) {
  K(this.g, new Ko(t));
};
rt.prototype.va = function(t) {
  K(this.g, new zo());
};
rt.prototype.ua = function() {
  K(this.g, "b");
};
dn.prototype.createWebChannel = dn.prototype.g;
oe.prototype.send = oe.prototype.u;
oe.prototype.open = oe.prototype.m;
oe.prototype.close = oe.prototype.close;
An.NO_ERROR = 0;
An.TIMEOUT = 8;
An.HTTP_ERROR = 6;
ho.COMPLETE = "complete";
lo.EventType = Ot;
Ot.OPEN = "a";
Ot.CLOSE = "b";
Ot.ERROR = "c";
Ot.MESSAGE = "d";
j.prototype.listen = j.prototype.N;
O.prototype.listenOnce = O.prototype.O;
O.prototype.getLastError = O.prototype.Oa;
O.prototype.getLastErrorCode = O.prototype.Ea;
O.prototype.getStatus = O.prototype.aa;
O.prototype.getResponseJson = O.prototype.Sa;
O.prototype.getResponseText = O.prototype.fa;
O.prototype.send = O.prototype.da;
O.prototype.setWithCredentials = O.prototype.Ka;
var gh = function() {
  return new dn();
}, mh = function() {
  return _n();
}, ts = An, yh = ho, vh = $e, Gr = { sb: 0, vb: 1, wb: 2, Pb: 3, Ub: 4, Rb: 5, Sb: 6, Qb: 7, Ob: 8, Tb: 9, PROXY: 10, NOPROXY: 11, Mb: 12, Ib: 13, Jb: 14, Hb: 15, Kb: 16, Lb: 17, ob: 18, nb: 19, pb: 20 }, wh = Pt, Gt = lo, Eh = O;
const Wr = "@firebase/firestore";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class W {
  constructor(e) {
    this.uid = e;
  }
  isAuthenticated() {
    return this.uid != null;
  }
  /**
   * Returns a key representing this user, suitable for inclusion in a
   * dictionary.
   */
  toKey() {
    return this.isAuthenticated() ? "uid:" + this.uid : "anonymous-user";
  }
  isEqual(e) {
    return e.uid === this.uid;
  }
}
W.UNAUTHENTICATED = new W(null), // TODO(mikelehen): Look into getting a proper uid-equivalent for
// non-FirebaseAuth providers.
W.GOOGLE_CREDENTIALS = new W("google-credentials-uid"), W.FIRST_PARTY = new W("first-party-uid"), W.MOCK_USER = new W("mock-user");
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let it = "9.15.0";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Fe = new Pi("@firebase/firestore");
function Qr() {
  return Fe.logLevel;
}
function y(t, ...e) {
  if (Fe.logLevel <= k.DEBUG) {
    const n = e.map(ir);
    Fe.debug(`Firestore (${it}): ${t}`, ...n);
  }
}
function ge(t, ...e) {
  if (Fe.logLevel <= k.ERROR) {
    const n = e.map(ir);
    Fe.error(`Firestore (${it}): ${t}`, ...n);
  }
}
function Ss(t, ...e) {
  if (Fe.logLevel <= k.WARN) {
    const n = e.map(ir);
    Fe.warn(`Firestore (${it}): ${t}`, ...n);
  }
}
function ir(t) {
  if (typeof t == "string") return t;
  try {
    return e = t, JSON.stringify(e);
  } catch {
    return t;
  }
  /**
  * @license
  * Copyright 2020 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *   http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */
  var e;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function C(t = "Unexpected state") {
  const e = `FIRESTORE (${it}) INTERNAL ASSERTION FAILED: ` + t;
  throw ge(e), new Error(e);
}
function U(t, e) {
  t || C();
}
function A(t, e) {
  return t;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const p = {
  // Causes are copied from:
  // https://github.com/grpc/grpc/blob/bceec94ea4fc5f0085d81235d8e1c06798dc341a/include/grpc%2B%2B/impl/codegen/status_code_enum.h
  /** Not an error; returned on success. */
  OK: "ok",
  /** The operation was cancelled (typically by the caller). */
  CANCELLED: "cancelled",
  /** Unknown error or an error from a different error domain. */
  UNKNOWN: "unknown",
  /**
   * Client specified an invalid argument. Note that this differs from
   * FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
   * problematic regardless of the state of the system (e.g., a malformed file
   * name).
   */
  INVALID_ARGUMENT: "invalid-argument",
  /**
   * Deadline expired before operation could complete. For operations that
   * change the state of the system, this error may be returned even if the
   * operation has completed successfully. For example, a successful response
   * from a server could have been delayed long enough for the deadline to
   * expire.
   */
  DEADLINE_EXCEEDED: "deadline-exceeded",
  /** Some requested entity (e.g., file or directory) was not found. */
  NOT_FOUND: "not-found",
  /**
   * Some entity that we attempted to create (e.g., file or directory) already
   * exists.
   */
  ALREADY_EXISTS: "already-exists",
  /**
   * The caller does not have permission to execute the specified operation.
   * PERMISSION_DENIED must not be used for rejections caused by exhausting
   * some resource (use RESOURCE_EXHAUSTED instead for those errors).
   * PERMISSION_DENIED must not be used if the caller can not be identified
   * (use UNAUTHENTICATED instead for those errors).
   */
  PERMISSION_DENIED: "permission-denied",
  /**
   * The request does not have valid authentication credentials for the
   * operation.
   */
  UNAUTHENTICATED: "unauthenticated",
  /**
   * Some resource has been exhausted, perhaps a per-user quota, or perhaps the
   * entire file system is out of space.
   */
  RESOURCE_EXHAUSTED: "resource-exhausted",
  /**
   * Operation was rejected because the system is not in a state required for
   * the operation's execution. For example, directory to be deleted may be
   * non-empty, an rmdir operation is applied to a non-directory, etc.
   *
   * A litmus test that may help a service implementor in deciding
   * between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
   *  (a) Use UNAVAILABLE if the client can retry just the failing call.
   *  (b) Use ABORTED if the client should retry at a higher-level
   *      (e.g., restarting a read-modify-write sequence).
   *  (c) Use FAILED_PRECONDITION if the client should not retry until
   *      the system state has been explicitly fixed. E.g., if an "rmdir"
   *      fails because the directory is non-empty, FAILED_PRECONDITION
   *      should be returned since the client should not retry unless
   *      they have first fixed up the directory by deleting files from it.
   *  (d) Use FAILED_PRECONDITION if the client performs conditional
   *      REST Get/Update/Delete on a resource and the resource on the
   *      server does not match the condition. E.g., conflicting
   *      read-modify-write on the same resource.
   */
  FAILED_PRECONDITION: "failed-precondition",
  /**
   * The operation was aborted, typically due to a concurrency issue like
   * sequencer check failures, transaction aborts, etc.
   *
   * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
   * and UNAVAILABLE.
   */
  ABORTED: "aborted",
  /**
   * Operation was attempted past the valid range. E.g., seeking or reading
   * past end of file.
   *
   * Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
   * if the system state changes. For example, a 32-bit file system will
   * generate INVALID_ARGUMENT if asked to read at an offset that is not in the
   * range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
   * an offset past the current file size.
   *
   * There is a fair bit of overlap between FAILED_PRECONDITION and
   * OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
   * when it applies so that callers who are iterating through a space can
   * easily look for an OUT_OF_RANGE error to detect when they are done.
   */
  OUT_OF_RANGE: "out-of-range",
  /** Operation is not implemented or not supported/enabled in this service. */
  UNIMPLEMENTED: "unimplemented",
  /**
   * Internal errors. Means some invariants expected by underlying System has
   * been broken. If you see one of these errors, Something is very broken.
   */
  INTERNAL: "internal",
  /**
   * The service is currently unavailable. This is a most likely a transient
   * condition and may be corrected by retrying with a backoff.
   *
   * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
   * and UNAVAILABLE.
   */
  UNAVAILABLE: "unavailable",
  /** Unrecoverable data loss or corruption. */
  DATA_LOSS: "data-loss"
};
class w extends Ve {
  /** @hideconstructor */
  constructor(e, n) {
    super(e, n), this.code = e, this.message = n, // HACK: We write a toString property directly because Error is not a real
    // class and so inheritance does not work correctly. We could alternatively
    // do the same "back-door inheritance" trick that FirebaseError does.
    this.toString = () => `${this.name}: [code=${this.code}]: ${this.message}`;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ne {
  constructor() {
    this.promise = new Promise((e, n) => {
      this.resolve = e, this.reject = n;
    });
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Go {
  constructor(e, n) {
    this.user = n, this.type = "OAuth", this.headers = /* @__PURE__ */ new Map(), this.headers.set("Authorization", `Bearer ${e}`);
  }
}
class Th {
  getToken() {
    return Promise.resolve(null);
  }
  invalidateToken() {
  }
  start(e, n) {
    e.enqueueRetryable(() => n(W.UNAUTHENTICATED));
  }
  shutdown() {
  }
}
class bh {
  constructor(e) {
    this.token = e, /**
     * Stores the listener registered with setChangeListener()
     * This isn't actually necessary since the UID never changes, but we use this
     * to verify the listen contract is adhered to in tests.
     */
    this.changeListener = null;
  }
  getToken() {
    return Promise.resolve(this.token);
  }
  invalidateToken() {
  }
  start(e, n) {
    this.changeListener = n, // Fire with initial user.
    e.enqueueRetryable(() => n(this.token.user));
  }
  shutdown() {
    this.changeListener = null;
  }
}
class Ch {
  constructor(e) {
    this.t = e, /** Tracks the current User. */
    this.currentUser = W.UNAUTHENTICATED, /**
     * Counter used to detect if the token changed while a getToken request was
     * outstanding.
     */
    this.i = 0, this.forceRefresh = !1, this.auth = null;
  }
  start(e, n) {
    let s = this.i;
    const r = (u) => this.i !== s ? (s = this.i, n(u)) : Promise.resolve();
    let i = new Ne();
    this.o = () => {
      this.i++, this.currentUser = this.u(), i.resolve(), i = new Ne(), e.enqueueRetryable(() => r(this.currentUser));
    };
    const o = () => {
      const u = i;
      e.enqueueRetryable(async () => {
        await u.promise, await r(this.currentUser);
      });
    }, a = (u) => {
      y("FirebaseAuthCredentialsProvider", "Auth detected"), this.auth = u, this.auth.addAuthTokenListener(this.o), o();
    };
    this.t.onInit((u) => a(u)), // Our users can initialize Auth right after Firestore, so we give it
    // a chance to register itself with the component framework before we
    // determine whether to start up in unauthenticated mode.
    setTimeout(() => {
      if (!this.auth) {
        const u = this.t.getImmediate({
          optional: !0
        });
        u ? a(u) : (
          // If auth is still not available, proceed with `null` user
          (y("FirebaseAuthCredentialsProvider", "Auth not yet detected"), i.resolve(), i = new Ne())
        );
      }
    }, 0), o();
  }
  getToken() {
    const e = this.i, n = this.forceRefresh;
    return this.forceRefresh = !1, this.auth ? this.auth.getToken(n).then((s) => (
      // Cancel the request since the token changed while the request was
      // outstanding so the response is potentially for a previous user (which
      // user, we can't be sure).
      this.i !== e ? (y("FirebaseAuthCredentialsProvider", "getToken aborted due to token change."), this.getToken()) : s ? (U(typeof s.accessToken == "string"), new Go(s.accessToken, this.currentUser)) : null
    )) : Promise.resolve(null);
  }
  invalidateToken() {
    this.forceRefresh = !0;
  }
  shutdown() {
    this.auth && this.auth.removeAuthTokenListener(this.o);
  }
  // Auth.getUid() can return null even with a user logged in. It is because
  // getUid() is synchronous, but the auth code populating Uid is asynchronous.
  // This method should only be called in the AuthTokenListener callback
  // to guarantee to get the actual user.
  u() {
    const e = this.auth && this.auth.getUid();
    return U(e === null || typeof e == "string"), new W(e);
  }
}
class Sh {
  constructor(e, n, s, r) {
    this.h = e, this.l = n, this.m = s, this.g = r, this.type = "FirstParty", this.user = W.FIRST_PARTY, this.p = /* @__PURE__ */ new Map();
  }
  /** Gets an authorization token, using a provided factory function, or falling back to First Party GAPI. */
  I() {
    return this.g ? this.g() : (
      // Make sure this really is a Gapi client.
      (U(!(typeof this.h != "object" || this.h === null || !this.h.auth || !this.h.auth.getAuthHeaderValueForFirstParty)), this.h.auth.getAuthHeaderValueForFirstParty([]))
    );
  }
  get headers() {
    this.p.set("X-Goog-AuthUser", this.l);
    const e = this.I();
    return e && this.p.set("Authorization", e), this.m && this.p.set("X-Goog-Iam-Authorization-Token", this.m), this.p;
  }
}
class Ih {
  constructor(e, n, s, r) {
    this.h = e, this.l = n, this.m = s, this.g = r;
  }
  getToken() {
    return Promise.resolve(new Sh(this.h, this.l, this.m, this.g));
  }
  start(e, n) {
    e.enqueueRetryable(() => n(W.FIRST_PARTY));
  }
  shutdown() {
  }
  invalidateToken() {
  }
}
class _h {
  constructor(e) {
    this.value = e, this.type = "AppCheck", this.headers = /* @__PURE__ */ new Map(), e && e.length > 0 && this.headers.set("x-firebase-appcheck", this.value);
  }
}
class Ah {
  constructor(e) {
    this.T = e, this.forceRefresh = !1, this.appCheck = null, this.A = null;
  }
  start(e, n) {
    const s = (i) => {
      i.error != null && y("FirebaseAppCheckTokenProvider", `Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);
      const o = i.token !== this.A;
      return this.A = i.token, y("FirebaseAppCheckTokenProvider", `Received ${o ? "new" : "existing"} token.`), o ? n(i.token) : Promise.resolve();
    };
    this.o = (i) => {
      e.enqueueRetryable(() => s(i));
    };
    const r = (i) => {
      y("FirebaseAppCheckTokenProvider", "AppCheck detected"), this.appCheck = i, this.appCheck.addTokenListener(this.o);
    };
    this.T.onInit((i) => r(i)), // Our users can initialize AppCheck after Firestore, so we give it
    // a chance to register itself with the component framework.
    setTimeout(() => {
      if (!this.appCheck) {
        const i = this.T.getImmediate({
          optional: !0
        });
        i ? r(i) : (
          // If AppCheck is still not available, proceed without it.
          y("FirebaseAppCheckTokenProvider", "AppCheck not yet detected")
        );
      }
    }, 0);
  }
  getToken() {
    const e = this.forceRefresh;
    return this.forceRefresh = !1, this.appCheck ? this.appCheck.getToken(e).then((n) => n ? (U(typeof n.token == "string"), this.A = n.token, new _h(n.token)) : null) : Promise.resolve(null);
  }
  invalidateToken() {
    this.forceRefresh = !0;
  }
  shutdown() {
    this.appCheck && this.appCheck.removeTokenListener(this.o);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Dh(t) {
  const e = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof self < "u" && (self.crypto || self.msCrypto)
  ), n = new Uint8Array(t);
  if (e && typeof e.getRandomValues == "function") e.getRandomValues(n);
  else
    for (let s = 0; s < t; s++) n[s] = Math.floor(256 * Math.random());
  return n;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class kh {
  static R() {
    const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = Math.floor(256 / e.length) * e.length;
    let s = "";
    for (; s.length < 20; ) {
      const r = Dh(40);
      for (let i = 0; i < r.length; ++i)
        s.length < 20 && r[i] < n && (s += e.charAt(r[i] % e.length));
    }
    return s;
  }
}
function R(t, e) {
  return t < e ? -1 : t > e ? 1 : 0;
}
function Ye(t, e, n) {
  return t.length === e.length && t.every((s, r) => n(s, e[r]));
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class re {
  /**
   * Creates a new timestamp.
   *
   * @param seconds - The number of seconds of UTC time since Unix epoch
   *     1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
   *     9999-12-31T23:59:59Z inclusive.
   * @param nanoseconds - The non-negative fractions of a second at nanosecond
   *     resolution. Negative second values with fractions must still have
   *     non-negative nanoseconds values that count forward in time. Must be
   *     from 0 to 999,999,999 inclusive.
   */
  constructor(e, n) {
    if (this.seconds = e, this.nanoseconds = n, n < 0) throw new w(p.INVALID_ARGUMENT, "Timestamp nanoseconds out of range: " + n);
    if (n >= 1e9) throw new w(p.INVALID_ARGUMENT, "Timestamp nanoseconds out of range: " + n);
    if (e < -62135596800) throw new w(p.INVALID_ARGUMENT, "Timestamp seconds out of range: " + e);
    if (e >= 253402300800) throw new w(p.INVALID_ARGUMENT, "Timestamp seconds out of range: " + e);
  }
  /**
   * Creates a new timestamp with the current date, with millisecond precision.
   *
   * @returns a new timestamp representing the current date.
   */
  static now() {
    return re.fromMillis(Date.now());
  }
  /**
   * Creates a new timestamp from the given date.
   *
   * @param date - The date to initialize the `Timestamp` from.
   * @returns A new `Timestamp` representing the same point in time as the given
   *     date.
   */
  static fromDate(e) {
    return re.fromMillis(e.getTime());
  }
  /**
   * Creates a new timestamp from the given number of milliseconds.
   *
   * @param milliseconds - Number of milliseconds since Unix epoch
   *     1970-01-01T00:00:00Z.
   * @returns A new `Timestamp` representing the same point in time as the given
   *     number of milliseconds.
   */
  static fromMillis(e) {
    const n = Math.floor(e / 1e3), s = Math.floor(1e6 * (e - 1e3 * n));
    return new re(n, s);
  }
  /**
   * Converts a `Timestamp` to a JavaScript `Date` object. This conversion
   * causes a loss of precision since `Date` objects only support millisecond
   * precision.
   *
   * @returns JavaScript `Date` object representing the same point in time as
   *     this `Timestamp`, with millisecond precision.
   */
  toDate() {
    return new Date(this.toMillis());
  }
  /**
   * Converts a `Timestamp` to a numeric timestamp (in milliseconds since
   * epoch). This operation causes a loss of precision.
   *
   * @returns The point in time corresponding to this timestamp, represented as
   *     the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
   */
  toMillis() {
    return 1e3 * this.seconds + this.nanoseconds / 1e6;
  }
  _compareTo(e) {
    return this.seconds === e.seconds ? R(this.nanoseconds, e.nanoseconds) : R(this.seconds, e.seconds);
  }
  /**
   * Returns true if this `Timestamp` is equal to the provided one.
   *
   * @param other - The `Timestamp` to compare against.
   * @returns true if this `Timestamp` is equal to the provided one.
   */
  isEqual(e) {
    return e.seconds === this.seconds && e.nanoseconds === this.nanoseconds;
  }
  /** Returns a textual representation of this `Timestamp`. */
  toString() {
    return "Timestamp(seconds=" + this.seconds + ", nanoseconds=" + this.nanoseconds + ")";
  }
  /** Returns a JSON-serializable representation of this `Timestamp`. */
  toJSON() {
    return {
      seconds: this.seconds,
      nanoseconds: this.nanoseconds
    };
  }
  /**
   * Converts this object to a primitive string, which allows `Timestamp` objects
   * to be compared using the `>`, `<=`, `>=` and `>` operators.
   */
  valueOf() {
    const e = this.seconds - -62135596800;
    return String(e).padStart(12, "0") + "." + String(this.nanoseconds).padStart(9, "0");
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class b {
  constructor(e) {
    this.timestamp = e;
  }
  static fromTimestamp(e) {
    return new b(e);
  }
  static min() {
    return new b(new re(0, 0));
  }
  static max() {
    return new b(new re(253402300799, 999999999));
  }
  compareTo(e) {
    return this.timestamp._compareTo(e.timestamp);
  }
  isEqual(e) {
    return this.timestamp.isEqual(e.timestamp);
  }
  /** Returns a number representation of the version for use in spec tests. */
  toMicroseconds() {
    return 1e6 * this.timestamp.seconds + this.timestamp.nanoseconds / 1e3;
  }
  toString() {
    return "SnapshotVersion(" + this.timestamp.toString() + ")";
  }
  toTimestamp() {
    return this.timestamp;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Dt {
  constructor(e, n, s) {
    n === void 0 ? n = 0 : n > e.length && C(), s === void 0 ? s = e.length - n : s > e.length - n && C(), this.segments = e, this.offset = n, this.len = s;
  }
  get length() {
    return this.len;
  }
  isEqual(e) {
    return Dt.comparator(this, e) === 0;
  }
  child(e) {
    const n = this.segments.slice(this.offset, this.limit());
    return e instanceof Dt ? e.forEach((s) => {
      n.push(s);
    }) : n.push(e), this.construct(n);
  }
  /** The index of one past the last segment of the path. */
  limit() {
    return this.offset + this.length;
  }
  popFirst(e) {
    return e = e === void 0 ? 1 : e, this.construct(this.segments, this.offset + e, this.length - e);
  }
  popLast() {
    return this.construct(this.segments, this.offset, this.length - 1);
  }
  firstSegment() {
    return this.segments[this.offset];
  }
  lastSegment() {
    return this.get(this.length - 1);
  }
  get(e) {
    return this.segments[this.offset + e];
  }
  isEmpty() {
    return this.length === 0;
  }
  isPrefixOf(e) {
    if (e.length < this.length) return !1;
    for (let n = 0; n < this.length; n++) if (this.get(n) !== e.get(n)) return !1;
    return !0;
  }
  isImmediateParentOf(e) {
    if (this.length + 1 !== e.length) return !1;
    for (let n = 0; n < this.length; n++) if (this.get(n) !== e.get(n)) return !1;
    return !0;
  }
  forEach(e) {
    for (let n = this.offset, s = this.limit(); n < s; n++) e(this.segments[n]);
  }
  toArray() {
    return this.segments.slice(this.offset, this.limit());
  }
  static comparator(e, n) {
    const s = Math.min(e.length, n.length);
    for (let r = 0; r < s; r++) {
      const i = e.get(r), o = n.get(r);
      if (i < o) return -1;
      if (i > o) return 1;
    }
    return e.length < n.length ? -1 : e.length > n.length ? 1 : 0;
  }
}
class x extends Dt {
  construct(e, n, s) {
    return new x(e, n, s);
  }
  canonicalString() {
    return this.toArray().join("/");
  }
  toString() {
    return this.canonicalString();
  }
  /**
   * Creates a resource path from the given slash-delimited string. If multiple
   * arguments are provided, all components are combined. Leading and trailing
   * slashes from all components are ignored.
   */
  static fromString(...e) {
    const n = [];
    for (const s of e) {
      if (s.indexOf("//") >= 0) throw new w(p.INVALID_ARGUMENT, `Invalid segment (${s}). Paths must not contain // in them.`);
      n.push(...s.split("/").filter((r) => r.length > 0));
    }
    return new x(n);
  }
  static emptyPath() {
    return new x([]);
  }
}
const Rh = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
class se extends Dt {
  construct(e, n, s) {
    return new se(e, n, s);
  }
  /**
   * Returns true if the string could be used as a segment in a field path
   * without escaping.
   */
  static isValidIdentifier(e) {
    return Rh.test(e);
  }
  canonicalString() {
    return this.toArray().map((e) => (e = e.replace(/\\/g, "\\\\").replace(/`/g, "\\`"), se.isValidIdentifier(e) || (e = "`" + e + "`"), e)).join(".");
  }
  toString() {
    return this.canonicalString();
  }
  /**
   * Returns true if this field references the key of a document.
   */
  isKeyField() {
    return this.length === 1 && this.get(0) === "__name__";
  }
  /**
   * The field designating the key of a document.
   */
  static keyField() {
    return new se(["__name__"]);
  }
  /**
   * Parses a field string from the given server-formatted string.
   *
   * - Splitting the empty string is not allowed (for now at least).
   * - Empty segments within the string (e.g. if there are two consecutive
   *   separators) are not allowed.
   *
   * TODO(b/37244157): we should make this more strict. Right now, it allows
   * non-identifier path components, even if they aren't escaped.
   */
  static fromServerFormat(e) {
    const n = [];
    let s = "", r = 0;
    const i = () => {
      if (s.length === 0) throw new w(p.INVALID_ARGUMENT, `Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);
      n.push(s), s = "";
    };
    let o = !1;
    for (; r < e.length; ) {
      const a = e[r];
      if (a === "\\") {
        if (r + 1 === e.length) throw new w(p.INVALID_ARGUMENT, "Path has trailing escape character: " + e);
        const u = e[r + 1];
        if (u !== "\\" && u !== "." && u !== "`") throw new w(p.INVALID_ARGUMENT, "Path has invalid escape sequence: " + e);
        s += u, r += 2;
      } else a === "`" ? (o = !o, r++) : a !== "." || o ? (s += a, r++) : (i(), r++);
    }
    if (i(), o) throw new w(p.INVALID_ARGUMENT, "Unterminated ` in path: " + e);
    return new se(n);
  }
  static emptyPath() {
    return new se([]);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class v {
  constructor(e) {
    this.path = e;
  }
  static fromPath(e) {
    return new v(x.fromString(e));
  }
  static fromName(e) {
    return new v(x.fromString(e).popFirst(5));
  }
  static empty() {
    return new v(x.emptyPath());
  }
  get collectionGroup() {
    return this.path.popLast().lastSegment();
  }
  /** Returns true if the document is in the specified collectionId. */
  hasCollectionId(e) {
    return this.path.length >= 2 && this.path.get(this.path.length - 2) === e;
  }
  /** Returns the collection group (i.e. the name of the parent collection) for this key. */
  getCollectionGroup() {
    return this.path.get(this.path.length - 2);
  }
  /** Returns the fully qualified path to the parent collection. */
  getCollectionPath() {
    return this.path.popLast();
  }
  isEqual(e) {
    return e !== null && x.comparator(this.path, e.path) === 0;
  }
  toString() {
    return this.path.toString();
  }
  static comparator(e, n) {
    return x.comparator(e.path, n.path);
  }
  static isDocumentKey(e) {
    return e.length % 2 == 0;
  }
  /**
   * Creates and returns a new document key with the given segments.
   *
   * @param segments - The segments of the path to the document
   * @returns A new instance of DocumentKey
   */
  static fromSegments(e) {
    return new v(new x(e.slice()));
  }
}
function Nh(t, e) {
  const n = t.toTimestamp().seconds, s = t.toTimestamp().nanoseconds + 1, r = b.fromTimestamp(s === 1e9 ? new re(n + 1, 0) : new re(n, s));
  return new Te(r, v.empty(), e);
}
function xh(t) {
  return new Te(t.readTime, t.key, -1);
}
class Te {
  constructor(e, n, s) {
    this.readTime = e, this.documentKey = n, this.largestBatchId = s;
  }
  /** Returns an offset that sorts before all regular offsets. */
  static min() {
    return new Te(b.min(), v.empty(), -1);
  }
  /** Returns an offset that sorts after all regular offsets. */
  static max() {
    return new Te(b.max(), v.empty(), -1);
  }
}
function Oh(t, e) {
  let n = t.readTime.compareTo(e.readTime);
  return n !== 0 ? n : (n = v.comparator(t.documentKey, e.documentKey), n !== 0 ? n : R(t.largestBatchId, e.largestBatchId));
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Lh = "The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";
class Mh {
  constructor() {
    this.onCommittedListeners = [];
  }
  addOnCommittedListener(e) {
    this.onCommittedListeners.push(e);
  }
  raiseOnCommittedEvent() {
    this.onCommittedListeners.forEach((e) => e());
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
async function or(t) {
  if (t.code !== p.FAILED_PRECONDITION || t.message !== Lh) throw t;
  y("LocalStore", "Unexpectedly lost primary lease");
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class d {
  constructor(e) {
    this.nextCallback = null, this.catchCallback = null, // When the operation resolves, we'll set result or error and mark isDone.
    this.result = void 0, this.error = void 0, this.isDone = !1, // Set to true when .then() or .catch() are called and prevents additional
    // chaining.
    this.callbackAttached = !1, e((n) => {
      this.isDone = !0, this.result = n, this.nextCallback && // value should be defined unless T is Void, but we can't express
      // that in the type system.
      this.nextCallback(n);
    }, (n) => {
      this.isDone = !0, this.error = n, this.catchCallback && this.catchCallback(n);
    });
  }
  catch(e) {
    return this.next(void 0, e);
  }
  next(e, n) {
    return this.callbackAttached && C(), this.callbackAttached = !0, this.isDone ? this.error ? this.wrapFailure(n, this.error) : this.wrapSuccess(e, this.result) : new d((s, r) => {
      this.nextCallback = (i) => {
        this.wrapSuccess(e, i).next(s, r);
      }, this.catchCallback = (i) => {
        this.wrapFailure(n, i).next(s, r);
      };
    });
  }
  toPromise() {
    return new Promise((e, n) => {
      this.next(e, n);
    });
  }
  wrapUserFunction(e) {
    try {
      const n = e();
      return n instanceof d ? n : d.resolve(n);
    } catch (n) {
      return d.reject(n);
    }
  }
  wrapSuccess(e, n) {
    return e ? this.wrapUserFunction(() => e(n)) : d.resolve(n);
  }
  wrapFailure(e, n) {
    return e ? this.wrapUserFunction(() => e(n)) : d.reject(n);
  }
  static resolve(e) {
    return new d((n, s) => {
      n(e);
    });
  }
  static reject(e) {
    return new d((n, s) => {
      s(e);
    });
  }
  static waitFor(e) {
    return new d((n, s) => {
      let r = 0, i = 0, o = !1;
      e.forEach((a) => {
        ++r, a.next(() => {
          ++i, o && i === r && n();
        }, (u) => s(u));
      }), o = !0, i === r && n();
    });
  }
  /**
   * Given an array of predicate functions that asynchronously evaluate to a
   * boolean, implements a short-circuiting `or` between the results. Predicates
   * will be evaluated until one of them returns `true`, then stop. The final
   * result will be whether any of them returned `true`.
   */
  static or(e) {
    let n = d.resolve(!1);
    for (const s of e) n = n.next((r) => r ? d.resolve(r) : s());
    return n;
  }
  static forEach(e, n) {
    const s = [];
    return e.forEach((r, i) => {
      s.push(n.call(this, r, i));
    }), this.waitFor(s);
  }
  /**
   * Concurrently map all array elements through asynchronous function.
   */
  static mapArray(e, n) {
    return new d((s, r) => {
      const i = e.length, o = new Array(i);
      let a = 0;
      for (let u = 0; u < i; u++) {
        const c = u;
        n(e[c]).next((h) => {
          o[c] = h, ++a, a === i && s(o);
        }, (h) => r(h));
      }
    });
  }
  /**
   * An alternative to recursive PersistencePromise calls, that avoids
   * potential memory problems from unbounded chains of promises.
   *
   * The `action` will be called repeatedly while `condition` is true.
   */
  static doWhile(e, n) {
    return new d((s, r) => {
      const i = () => {
        e() === !0 ? n().next(() => {
          i();
        }, r) : s();
      };
      i();
    });
  }
}
function Bt(t) {
  return t.name === "IndexedDbTransactionError";
}
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ar {
  constructor(e, n) {
    this.previousValue = e, n && (n.sequenceNumberHandler = (s) => this.ut(s), this.ct = (s) => n.writeSequenceNumber(s));
  }
  ut(e) {
    return this.previousValue = Math.max(e, this.previousValue), this.previousValue;
  }
  next() {
    const e = ++this.previousValue;
    return this.ct && this.ct(e), e;
  }
}
ar.at = -1;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ph {
  /**
   * Constructs a DatabaseInfo using the provided host, databaseId and
   * persistenceKey.
   *
   * @param databaseId - The database to use.
   * @param appId - The Firebase App Id.
   * @param persistenceKey - A unique identifier for this Firestore's local
   * storage (used in conjunction with the databaseId).
   * @param host - The Firestore backend host to connect to.
   * @param ssl - Whether to use SSL when connecting.
   * @param forceLongPolling - Whether to use the forceLongPolling option
   * when using WebChannel as the network transport.
   * @param autoDetectLongPolling - Whether to use the detectBufferingProxy
   * option when using WebChannel as the network transport.
   * @param useFetchStreams Whether to use the Fetch API instead of
   * XMLHTTPRequest
   */
  constructor(e, n, s, r, i, o, a, u) {
    this.databaseId = e, this.appId = n, this.persistenceKey = s, this.host = r, this.ssl = i, this.forceLongPolling = o, this.autoDetectLongPolling = a, this.useFetchStreams = u;
  }
}
class kt {
  constructor(e, n) {
    this.projectId = e, this.database = n || "(default)";
  }
  static empty() {
    return new kt("", "");
  }
  get isDefaultDatabase() {
    return this.database === "(default)";
  }
  isEqual(e) {
    return e instanceof kt && e.projectId === this.projectId && e.database === this.database;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Xr(t) {
  let e = 0;
  for (const n in t) Object.prototype.hasOwnProperty.call(t, n) && e++;
  return e;
}
function Mn(t, e) {
  for (const n in t) Object.prototype.hasOwnProperty.call(t, n) && e(n, t[n]);
}
function Fh(t) {
  for (const e in t) if (Object.prototype.hasOwnProperty.call(t, e)) return !1;
  return !0;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Pn(t) {
  return t == null;
}
function Is(t) {
  return t === 0 && 1 / t == -1 / 0;
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class J {
  constructor(e) {
    this.binaryString = e;
  }
  static fromBase64String(e) {
    const n = atob(e);
    return new J(n);
  }
  static fromUint8Array(e) {
    const n = (
      /**
      * Helper function to convert an Uint8array to a binary string.
      */
      function(s) {
        let r = "";
        for (let i = 0; i < s.length; ++i) r += String.fromCharCode(s[i]);
        return r;
      }(e)
    );
    return new J(n);
  }
  [Symbol.iterator]() {
    let e = 0;
    return {
      next: () => e < this.binaryString.length ? {
        value: this.binaryString.charCodeAt(e++),
        done: !1
      } : {
        value: void 0,
        done: !0
      }
    };
  }
  toBase64() {
    return e = this.binaryString, btoa(e);
    var e;
  }
  toUint8Array() {
    return function(e) {
      const n = new Uint8Array(e.length);
      for (let s = 0; s < e.length; s++) n[s] = e.charCodeAt(s);
      return n;
    }(this.binaryString);
  }
  approximateByteSize() {
    return 2 * this.binaryString.length;
  }
  compareTo(e) {
    return R(this.binaryString, e.binaryString);
  }
  isEqual(e) {
    return this.binaryString === e.binaryString;
  }
}
J.EMPTY_BYTE_STRING = new J("");
const Uh = new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);
function be(t) {
  if (U(!!t), typeof t == "string") {
    let e = 0;
    const n = Uh.exec(t);
    if (U(!!n), n[1]) {
      let r = n[1];
      r = (r + "000000000").substr(0, 9), e = Number(r);
    }
    const s = new Date(t);
    return {
      seconds: Math.floor(s.getTime() / 1e3),
      nanos: e
    };
  }
  return {
    seconds: F(t.seconds),
    nanos: F(t.nanos)
  };
}
function F(t) {
  return typeof t == "number" ? t : typeof t == "string" ? Number(t) : 0;
}
function Je(t) {
  return typeof t == "string" ? J.fromBase64String(t) : J.fromUint8Array(t);
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Wo(t) {
  var e, n;
  return ((n = (((e = t == null ? void 0 : t.mapValue) === null || e === void 0 ? void 0 : e.fields) || {}).__type__) === null || n === void 0 ? void 0 : n.stringValue) === "server_timestamp";
}
function Qo(t) {
  const e = t.mapValue.fields.__previous_value__;
  return Wo(e) ? Qo(e) : e;
}
function Rt(t) {
  const e = be(t.mapValue.fields.__local_write_time__.timestampValue);
  return new re(e.seconds, e.nanos);
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Wt = {
  mapValue: {}
};
function Ue(t) {
  return "nullValue" in t ? 0 : "booleanValue" in t ? 1 : "integerValue" in t || "doubleValue" in t ? 2 : "timestampValue" in t ? 3 : "stringValue" in t ? 5 : "bytesValue" in t ? 6 : "referenceValue" in t ? 7 : "geoPointValue" in t ? 8 : "arrayValue" in t ? 9 : "mapValue" in t ? Wo(t) ? 4 : Bh(t) ? 9007199254740991 : 10 : C();
}
function he(t, e) {
  if (t === e) return !0;
  const n = Ue(t);
  if (n !== Ue(e)) return !1;
  switch (n) {
    case 0:
    case 9007199254740991:
      return !0;
    case 1:
      return t.booleanValue === e.booleanValue;
    case 4:
      return Rt(t).isEqual(Rt(e));
    case 3:
      return function(s, r) {
        if (typeof s.timestampValue == "string" && typeof r.timestampValue == "string" && s.timestampValue.length === r.timestampValue.length)
          return s.timestampValue === r.timestampValue;
        const i = be(s.timestampValue), o = be(r.timestampValue);
        return i.seconds === o.seconds && i.nanos === o.nanos;
      }(t, e);
    case 5:
      return t.stringValue === e.stringValue;
    case 6:
      return function(s, r) {
        return Je(s.bytesValue).isEqual(Je(r.bytesValue));
      }(t, e);
    case 7:
      return t.referenceValue === e.referenceValue;
    case 8:
      return function(s, r) {
        return F(s.geoPointValue.latitude) === F(r.geoPointValue.latitude) && F(s.geoPointValue.longitude) === F(r.geoPointValue.longitude);
      }(t, e);
    case 2:
      return function(s, r) {
        if ("integerValue" in s && "integerValue" in r) return F(s.integerValue) === F(r.integerValue);
        if ("doubleValue" in s && "doubleValue" in r) {
          const i = F(s.doubleValue), o = F(r.doubleValue);
          return i === o ? Is(i) === Is(o) : isNaN(i) && isNaN(o);
        }
        return !1;
      }(t, e);
    case 9:
      return Ye(t.arrayValue.values || [], e.arrayValue.values || [], he);
    case 10:
      return function(s, r) {
        const i = s.mapValue.fields || {}, o = r.mapValue.fields || {};
        if (Xr(i) !== Xr(o)) return !1;
        for (const a in i) if (i.hasOwnProperty(a) && (o[a] === void 0 || !he(i[a], o[a]))) return !1;
        return !0;
      }(t, e);
    default:
      return C();
  }
}
function Nt(t, e) {
  return (t.values || []).find((n) => he(n, e)) !== void 0;
}
function Ze(t, e) {
  if (t === e) return 0;
  const n = Ue(t), s = Ue(e);
  if (n !== s) return R(n, s);
  switch (n) {
    case 0:
    case 9007199254740991:
      return 0;
    case 1:
      return R(t.booleanValue, e.booleanValue);
    case 2:
      return function(r, i) {
        const o = F(r.integerValue || r.doubleValue), a = F(i.integerValue || i.doubleValue);
        return o < a ? -1 : o > a ? 1 : o === a ? 0 : (
          // one or both are NaN.
          isNaN(o) ? isNaN(a) ? 0 : -1 : 1
        );
      }(t, e);
    case 3:
      return Yr(t.timestampValue, e.timestampValue);
    case 4:
      return Yr(Rt(t), Rt(e));
    case 5:
      return R(t.stringValue, e.stringValue);
    case 6:
      return function(r, i) {
        const o = Je(r), a = Je(i);
        return o.compareTo(a);
      }(t.bytesValue, e.bytesValue);
    case 7:
      return function(r, i) {
        const o = r.split("/"), a = i.split("/");
        for (let u = 0; u < o.length && u < a.length; u++) {
          const c = R(o[u], a[u]);
          if (c !== 0) return c;
        }
        return R(o.length, a.length);
      }(t.referenceValue, e.referenceValue);
    case 8:
      return function(r, i) {
        const o = R(F(r.latitude), F(i.latitude));
        return o !== 0 ? o : R(F(r.longitude), F(i.longitude));
      }(t.geoPointValue, e.geoPointValue);
    case 9:
      return function(r, i) {
        const o = r.values || [], a = i.values || [];
        for (let u = 0; u < o.length && u < a.length; ++u) {
          const c = Ze(o[u], a[u]);
          if (c) return c;
        }
        return R(o.length, a.length);
      }(t.arrayValue, e.arrayValue);
    case 10:
      return function(r, i) {
        if (r === Wt.mapValue && i === Wt.mapValue) return 0;
        if (r === Wt.mapValue) return 1;
        if (i === Wt.mapValue) return -1;
        const o = r.fields || {}, a = Object.keys(o), u = i.fields || {}, c = Object.keys(u);
        a.sort(), c.sort();
        for (let h = 0; h < a.length && h < c.length; ++h) {
          const l = R(a[h], c[h]);
          if (l !== 0) return l;
          const f = Ze(o[a[h]], u[c[h]]);
          if (f !== 0) return f;
        }
        return R(a.length, c.length);
      }(t.mapValue, e.mapValue);
    default:
      throw C();
  }
}
function Yr(t, e) {
  if (typeof t == "string" && typeof e == "string" && t.length === e.length) return R(t, e);
  const n = be(t), s = be(e), r = R(n.seconds, s.seconds);
  return r !== 0 ? r : R(n.nanos, s.nanos);
}
function et(t) {
  return _s(t);
}
function _s(t) {
  return "nullValue" in t ? "null" : "booleanValue" in t ? "" + t.booleanValue : "integerValue" in t ? "" + t.integerValue : "doubleValue" in t ? "" + t.doubleValue : "timestampValue" in t ? function(s) {
    const r = be(s);
    return `time(${r.seconds},${r.nanos})`;
  }(t.timestampValue) : "stringValue" in t ? t.stringValue : "bytesValue" in t ? Je(t.bytesValue).toBase64() : "referenceValue" in t ? (n = t.referenceValue, v.fromName(n).toString()) : "geoPointValue" in t ? `geo(${(e = t.geoPointValue).latitude},${e.longitude})` : "arrayValue" in t ? function(s) {
    let r = "[", i = !0;
    for (const o of s.values || []) i ? i = !1 : r += ",", r += _s(o);
    return r + "]";
  }(t.arrayValue) : "mapValue" in t ? function(s) {
    const r = Object.keys(s.fields || {}).sort();
    let i = "{", o = !0;
    for (const a of r) o ? o = !1 : i += ",", i += `${a}:${_s(s.fields[a])}`;
    return i + "}";
  }(t.mapValue) : C();
  var e, n;
}
function As(t) {
  return !!t && "integerValue" in t;
}
function ur(t) {
  return !!t && "arrayValue" in t;
}
function Jr(t) {
  return !!t && "nullValue" in t;
}
function Zr(t) {
  return !!t && "doubleValue" in t && isNaN(Number(t.doubleValue));
}
function ns(t) {
  return !!t && "mapValue" in t;
}
function mt(t) {
  if (t.geoPointValue) return {
    geoPointValue: Object.assign({}, t.geoPointValue)
  };
  if (t.timestampValue && typeof t.timestampValue == "object") return {
    timestampValue: Object.assign({}, t.timestampValue)
  };
  if (t.mapValue) {
    const e = {
      mapValue: {
        fields: {}
      }
    };
    return Mn(t.mapValue.fields, (n, s) => e.mapValue.fields[n] = mt(s)), e;
  }
  if (t.arrayValue) {
    const e = {
      arrayValue: {
        values: []
      }
    };
    for (let n = 0; n < (t.arrayValue.values || []).length; ++n) e.arrayValue.values[n] = mt(t.arrayValue.values[n]);
    return e;
  }
  return Object.assign({}, t);
}
function Bh(t) {
  return (((t.mapValue || {}).fields || {}).__type__ || {}).stringValue === "__max__";
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class fn {
  constructor(e, n) {
    this.position = e, this.inclusive = n;
  }
}
function ei(t, e, n) {
  let s = 0;
  for (let r = 0; r < t.position.length; r++) {
    const i = e[r], o = t.position[r];
    if (i.field.isKeyField() ? s = v.comparator(v.fromName(o.referenceValue), n.key) : s = Ze(o, n.data.field(i.field)), i.dir === "desc" && (s *= -1), s !== 0) break;
  }
  return s;
}
function ti(t, e) {
  if (t === null) return e === null;
  if (e === null || t.inclusive !== e.inclusive || t.position.length !== e.position.length) return !1;
  for (let n = 0; n < t.position.length; n++)
    if (!he(t.position[n], e.position[n])) return !1;
  return !0;
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Xo {
}
class V extends Xo {
  constructor(e, n, s) {
    super(), this.field = e, this.op = n, this.value = s;
  }
  /**
   * Creates a filter based on the provided arguments.
   */
  static create(e, n, s) {
    return e.isKeyField() ? n === "in" || n === "not-in" ? this.createKeyFieldInFilter(e, n, s) : new qh(e, n, s) : n === "array-contains" ? new Kh(e, s) : n === "in" ? new zh(e, s) : n === "not-in" ? new Gh(e, s) : n === "array-contains-any" ? new Wh(e, s) : new V(e, n, s);
  }
  static createKeyFieldInFilter(e, n, s) {
    return n === "in" ? new jh(e, s) : new Hh(e, s);
  }
  matches(e) {
    const n = e.data.field(this.field);
    return this.op === "!=" ? n !== null && this.matchesComparison(Ze(n, this.value)) : n !== null && Ue(this.value) === Ue(n) && this.matchesComparison(Ze(n, this.value));
  }
  matchesComparison(e) {
    switch (this.op) {
      case "<":
        return e < 0;
      case "<=":
        return e <= 0;
      case "==":
        return e === 0;
      case "!=":
        return e !== 0;
      case ">":
        return e > 0;
      case ">=":
        return e >= 0;
      default:
        return C();
    }
  }
  isInequality() {
    return [
      "<",
      "<=",
      ">",
      ">=",
      "!=",
      "not-in"
      /* Operator.NOT_IN */
    ].indexOf(this.op) >= 0;
  }
  getFlattenedFilters() {
    return [this];
  }
  getFilters() {
    return [this];
  }
  getFirstInequalityField() {
    return this.isInequality() ? this.field : null;
  }
}
class le extends Xo {
  constructor(e, n) {
    super(), this.filters = e, this.op = n, this.ht = null;
  }
  /**
   * Creates a filter based on the provided arguments.
   */
  static create(e, n) {
    return new le(e, n);
  }
  matches(e) {
    return Yo(this) ? this.filters.find((n) => !n.matches(e)) === void 0 : this.filters.find((n) => n.matches(e)) !== void 0;
  }
  getFlattenedFilters() {
    return this.ht !== null || (this.ht = this.filters.reduce((e, n) => e.concat(n.getFlattenedFilters()), [])), this.ht;
  }
  // Returns a mutable copy of `this.filters`
  getFilters() {
    return Object.assign([], this.filters);
  }
  getFirstInequalityField() {
    const e = this.lt((n) => n.isInequality());
    return e !== null ? e.field : null;
  }
  // Performs a depth-first search to find and return the first FieldFilter in the composite filter
  // that satisfies the predicate. Returns `null` if none of the FieldFilters satisfy the
  // predicate.
  lt(e) {
    for (const n of this.getFlattenedFilters()) if (e(n)) return n;
    return null;
  }
}
function Yo(t) {
  return t.op === "and";
}
function Vh(t) {
  return $h(t) && Yo(t);
}
function $h(t) {
  for (const e of t.filters) if (e instanceof le) return !1;
  return !0;
}
function Jo(t) {
  if (t instanceof V)
    return t.field.canonicalString() + t.op.toString() + et(t.value);
  {
    const e = t.filters.map((n) => Jo(n)).join(",");
    return `${t.op}(${e})`;
  }
}
function Zo(t, e) {
  return t instanceof V ? function(n, s) {
    return s instanceof V && n.op === s.op && n.field.isEqual(s.field) && he(n.value, s.value);
  }(t, e) : t instanceof le ? function(n, s) {
    return s instanceof le && n.op === s.op && n.filters.length === s.filters.length ? n.filters.reduce((r, i, o) => r && Zo(i, s.filters[o]), !0) : !1;
  }(t, e) : void C();
}
function ea(t) {
  return t instanceof V ? function(e) {
    return `${e.field.canonicalString()} ${e.op} ${et(e.value)}`;
  }(t) : t instanceof le ? function(e) {
    return e.op.toString() + " {" + e.getFilters().map(ea).join(" ,") + "}";
  }(t) : "Filter";
}
class qh extends V {
  constructor(e, n, s) {
    super(e, n, s), this.key = v.fromName(s.referenceValue);
  }
  matches(e) {
    const n = v.comparator(e.key, this.key);
    return this.matchesComparison(n);
  }
}
class jh extends V {
  constructor(e, n) {
    super(e, "in", n), this.keys = ta("in", n);
  }
  matches(e) {
    return this.keys.some((n) => n.isEqual(e.key));
  }
}
class Hh extends V {
  constructor(e, n) {
    super(e, "not-in", n), this.keys = ta("not-in", n);
  }
  matches(e) {
    return !this.keys.some((n) => n.isEqual(e.key));
  }
}
function ta(t, e) {
  var n;
  return (((n = e.arrayValue) === null || n === void 0 ? void 0 : n.values) || []).map((s) => v.fromName(s.referenceValue));
}
class Kh extends V {
  constructor(e, n) {
    super(e, "array-contains", n);
  }
  matches(e) {
    const n = e.data.field(this.field);
    return ur(n) && Nt(n.arrayValue, this.value);
  }
}
class zh extends V {
  constructor(e, n) {
    super(e, "in", n);
  }
  matches(e) {
    const n = e.data.field(this.field);
    return n !== null && Nt(this.value.arrayValue, n);
  }
}
class Gh extends V {
  constructor(e, n) {
    super(e, "not-in", n);
  }
  matches(e) {
    if (Nt(this.value.arrayValue, {
      nullValue: "NULL_VALUE"
    })) return !1;
    const n = e.data.field(this.field);
    return n !== null && !Nt(this.value.arrayValue, n);
  }
}
class Wh extends V {
  constructor(e, n) {
    super(e, "array-contains-any", n);
  }
  matches(e) {
    const n = e.data.field(this.field);
    return !(!ur(n) || !n.arrayValue.values) && n.arrayValue.values.some((s) => Nt(this.value.arrayValue, s));
  }
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class yt {
  constructor(e, n = "asc") {
    this.field = e, this.dir = n;
  }
}
function Qh(t, e) {
  return t.dir === e.dir && t.field.isEqual(e.field);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class z {
  constructor(e, n) {
    this.comparator = e, this.root = n || H.EMPTY;
  }
  // Returns a copy of the map, with the specified key/value added or replaced.
  insert(e, n) {
    return new z(this.comparator, this.root.insert(e, n, this.comparator).copy(null, null, H.BLACK, null, null));
  }
  // Returns a copy of the map, with the specified key removed.
  remove(e) {
    return new z(this.comparator, this.root.remove(e, this.comparator).copy(null, null, H.BLACK, null, null));
  }
  // Returns the value of the node with the given key, or null.
  get(e) {
    let n = this.root;
    for (; !n.isEmpty(); ) {
      const s = this.comparator(e, n.key);
      if (s === 0) return n.value;
      s < 0 ? n = n.left : s > 0 && (n = n.right);
    }
    return null;
  }
  // Returns the index of the element in this sorted map, or -1 if it doesn't
  // exist.
  indexOf(e) {
    let n = 0, s = this.root;
    for (; !s.isEmpty(); ) {
      const r = this.comparator(e, s.key);
      if (r === 0) return n + s.left.size;
      r < 0 ? s = s.left : (
        // Count all nodes left of the node plus the node itself
        (n += s.left.size + 1, s = s.right)
      );
    }
    return -1;
  }
  isEmpty() {
    return this.root.isEmpty();
  }
  // Returns the total number of nodes in the map.
  get size() {
    return this.root.size;
  }
  // Returns the minimum key in the map.
  minKey() {
    return this.root.minKey();
  }
  // Returns the maximum key in the map.
  maxKey() {
    return this.root.maxKey();
  }
  // Traverses the map in key order and calls the specified action function
  // for each key/value pair. If action returns true, traversal is aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  inorderTraversal(e) {
    return this.root.inorderTraversal(e);
  }
  forEach(e) {
    this.inorderTraversal((n, s) => (e(n, s), !1));
  }
  toString() {
    const e = [];
    return this.inorderTraversal((n, s) => (e.push(`${n}:${s}`), !1)), `{${e.join(", ")}}`;
  }
  // Traverses the map in reverse key order and calls the specified action
  // function for each key/value pair. If action returns true, traversal is
  // aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  reverseTraversal(e) {
    return this.root.reverseTraversal(e);
  }
  // Returns an iterator over the SortedMap.
  getIterator() {
    return new Qt(this.root, null, this.comparator, !1);
  }
  getIteratorFrom(e) {
    return new Qt(this.root, e, this.comparator, !1);
  }
  getReverseIterator() {
    return new Qt(this.root, null, this.comparator, !0);
  }
  getReverseIteratorFrom(e) {
    return new Qt(this.root, e, this.comparator, !0);
  }
}
class Qt {
  constructor(e, n, s, r) {
    this.isReverse = r, this.nodeStack = [];
    let i = 1;
    for (; !e.isEmpty(); ) if (i = n ? s(e.key, n) : 1, // flip the comparison if we're going in reverse
    n && r && (i *= -1), i < 0)
      e = this.isReverse ? e.left : e.right;
    else {
      if (i === 0) {
        this.nodeStack.push(e);
        break;
      }
      this.nodeStack.push(e), e = this.isReverse ? e.right : e.left;
    }
  }
  getNext() {
    let e = this.nodeStack.pop();
    const n = {
      key: e.key,
      value: e.value
    };
    if (this.isReverse) for (e = e.left; !e.isEmpty(); ) this.nodeStack.push(e), e = e.right;
    else for (e = e.right; !e.isEmpty(); ) this.nodeStack.push(e), e = e.left;
    return n;
  }
  hasNext() {
    return this.nodeStack.length > 0;
  }
  peek() {
    if (this.nodeStack.length === 0) return null;
    const e = this.nodeStack[this.nodeStack.length - 1];
    return {
      key: e.key,
      value: e.value
    };
  }
}
class H {
  constructor(e, n, s, r, i) {
    this.key = e, this.value = n, this.color = s ?? H.RED, this.left = r ?? H.EMPTY, this.right = i ?? H.EMPTY, this.size = this.left.size + 1 + this.right.size;
  }
  // Returns a copy of the current node, optionally replacing pieces of it.
  copy(e, n, s, r, i) {
    return new H(e ?? this.key, n ?? this.value, s ?? this.color, r ?? this.left, i ?? this.right);
  }
  isEmpty() {
    return !1;
  }
  // Traverses the tree in key order and calls the specified action function
  // for each node. If action returns true, traversal is aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  inorderTraversal(e) {
    return this.left.inorderTraversal(e) || e(this.key, this.value) || this.right.inorderTraversal(e);
  }
  // Traverses the tree in reverse key order and calls the specified action
  // function for each node. If action returns true, traversal is aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  reverseTraversal(e) {
    return this.right.reverseTraversal(e) || e(this.key, this.value) || this.left.reverseTraversal(e);
  }
  // Returns the minimum node in the tree.
  min() {
    return this.left.isEmpty() ? this : this.left.min();
  }
  // Returns the maximum key in the tree.
  minKey() {
    return this.min().key;
  }
  // Returns the maximum key in the tree.
  maxKey() {
    return this.right.isEmpty() ? this.key : this.right.maxKey();
  }
  // Returns new tree, with the key/value added.
  insert(e, n, s) {
    let r = this;
    const i = s(e, r.key);
    return r = i < 0 ? r.copy(null, null, null, r.left.insert(e, n, s), null) : i === 0 ? r.copy(null, n, null, null, null) : r.copy(null, null, null, null, r.right.insert(e, n, s)), r.fixUp();
  }
  removeMin() {
    if (this.left.isEmpty()) return H.EMPTY;
    let e = this;
    return e.left.isRed() || e.left.left.isRed() || (e = e.moveRedLeft()), e = e.copy(null, null, null, e.left.removeMin(), null), e.fixUp();
  }
  // Returns new tree, with the specified item removed.
  remove(e, n) {
    let s, r = this;
    if (n(e, r.key) < 0) r.left.isEmpty() || r.left.isRed() || r.left.left.isRed() || (r = r.moveRedLeft()), r = r.copy(null, null, null, r.left.remove(e, n), null);
    else {
      if (r.left.isRed() && (r = r.rotateRight()), r.right.isEmpty() || r.right.isRed() || r.right.left.isRed() || (r = r.moveRedRight()), n(e, r.key) === 0) {
        if (r.right.isEmpty()) return H.EMPTY;
        s = r.right.min(), r = r.copy(s.key, s.value, null, null, r.right.removeMin());
      }
      r = r.copy(null, null, null, null, r.right.remove(e, n));
    }
    return r.fixUp();
  }
  isRed() {
    return this.color;
  }
  // Returns new tree after performing any needed rotations.
  fixUp() {
    let e = this;
    return e.right.isRed() && !e.left.isRed() && (e = e.rotateLeft()), e.left.isRed() && e.left.left.isRed() && (e = e.rotateRight()), e.left.isRed() && e.right.isRed() && (e = e.colorFlip()), e;
  }
  moveRedLeft() {
    let e = this.colorFlip();
    return e.right.left.isRed() && (e = e.copy(null, null, null, null, e.right.rotateRight()), e = e.rotateLeft(), e = e.colorFlip()), e;
  }
  moveRedRight() {
    let e = this.colorFlip();
    return e.left.left.isRed() && (e = e.rotateRight(), e = e.colorFlip()), e;
  }
  rotateLeft() {
    const e = this.copy(null, null, H.RED, null, this.right.left);
    return this.right.copy(null, null, this.color, e, null);
  }
  rotateRight() {
    const e = this.copy(null, null, H.RED, this.left.right, null);
    return this.left.copy(null, null, this.color, null, e);
  }
  colorFlip() {
    const e = this.left.copy(null, null, !this.left.color, null, null), n = this.right.copy(null, null, !this.right.color, null, null);
    return this.copy(null, null, !this.color, e, n);
  }
  // For testing.
  checkMaxDepth() {
    const e = this.check();
    return Math.pow(2, e) <= this.size + 1;
  }
  // In a balanced RB tree, the black-depth (number of black nodes) from root to
  // leaves is equal on both sides.  This function verifies that or asserts.
  check() {
    if (this.isRed() && this.left.isRed() || this.right.isRed()) throw C();
    const e = this.left.check();
    if (e !== this.right.check()) throw C();
    return e + (this.isRed() ? 0 : 1);
  }
}
H.EMPTY = null, H.RED = !0, H.BLACK = !1;
H.EMPTY = new // Represents an empty node (a leaf node in the Red-Black Tree).
class {
  constructor() {
    this.size = 0;
  }
  get key() {
    throw C();
  }
  get value() {
    throw C();
  }
  get color() {
    throw C();
  }
  get left() {
    throw C();
  }
  get right() {
    throw C();
  }
  // Returns a copy of the current node.
  copy(t, e, n, s, r) {
    return this;
  }
  // Returns a copy of the tree, with the specified key/value added.
  insert(t, e, n) {
    return new H(t, e);
  }
  // Returns a copy of the tree, with the specified key removed.
  remove(t, e) {
    return this;
  }
  isEmpty() {
    return !0;
  }
  inorderTraversal(t) {
    return !1;
  }
  reverseTraversal(t) {
    return !1;
  }
  minKey() {
    return null;
  }
  maxKey() {
    return null;
  }
  isRed() {
    return !1;
  }
  // For testing.
  checkMaxDepth() {
    return !0;
  }
  check() {
    return 0;
  }
}();
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class $ {
  constructor(e) {
    this.comparator = e, this.data = new z(this.comparator);
  }
  has(e) {
    return this.data.get(e) !== null;
  }
  first() {
    return this.data.minKey();
  }
  last() {
    return this.data.maxKey();
  }
  get size() {
    return this.data.size;
  }
  indexOf(e) {
    return this.data.indexOf(e);
  }
  /** Iterates elements in order defined by "comparator" */
  forEach(e) {
    this.data.inorderTraversal((n, s) => (e(n), !1));
  }
  /** Iterates over `elem`s such that: range[0] &lt;= elem &lt; range[1]. */
  forEachInRange(e, n) {
    const s = this.data.getIteratorFrom(e[0]);
    for (; s.hasNext(); ) {
      const r = s.getNext();
      if (this.comparator(r.key, e[1]) >= 0) return;
      n(r.key);
    }
  }
  /**
   * Iterates over `elem`s such that: start &lt;= elem until false is returned.
   */
  forEachWhile(e, n) {
    let s;
    for (s = n !== void 0 ? this.data.getIteratorFrom(n) : this.data.getIterator(); s.hasNext(); )
      if (!e(s.getNext().key)) return;
  }
  /** Finds the least element greater than or equal to `elem`. */
  firstAfterOrEqual(e) {
    const n = this.data.getIteratorFrom(e);
    return n.hasNext() ? n.getNext().key : null;
  }
  getIterator() {
    return new ni(this.data.getIterator());
  }
  getIteratorFrom(e) {
    return new ni(this.data.getIteratorFrom(e));
  }
  /** Inserts or updates an element */
  add(e) {
    return this.copy(this.data.remove(e).insert(e, !0));
  }
  /** Deletes an element */
  delete(e) {
    return this.has(e) ? this.copy(this.data.remove(e)) : this;
  }
  isEmpty() {
    return this.data.isEmpty();
  }
  unionWith(e) {
    let n = this;
    return n.size < e.size && (n = e, e = this), e.forEach((s) => {
      n = n.add(s);
    }), n;
  }
  isEqual(e) {
    if (!(e instanceof $) || this.size !== e.size) return !1;
    const n = this.data.getIterator(), s = e.data.getIterator();
    for (; n.hasNext(); ) {
      const r = n.getNext().key, i = s.getNext().key;
      if (this.comparator(r, i) !== 0) return !1;
    }
    return !0;
  }
  toArray() {
    const e = [];
    return this.forEach((n) => {
      e.push(n);
    }), e;
  }
  toString() {
    const e = [];
    return this.forEach((n) => e.push(n)), "SortedSet(" + e.toString() + ")";
  }
  copy(e) {
    const n = new $(this.comparator);
    return n.data = e, n;
  }
}
class ni {
  constructor(e) {
    this.iter = e;
  }
  getNext() {
    return this.iter.getNext().key;
  }
  hasNext() {
    return this.iter.hasNext();
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class xe {
  constructor(e) {
    this.fields = e, // TODO(dimond): validation of FieldMask
    // Sort the field mask to support `FieldMask.isEqual()` and assert below.
    e.sort(se.comparator);
  }
  static empty() {
    return new xe([]);
  }
  /**
   * Returns a new FieldMask object that is the result of adding all the given
   * fields paths to this field mask.
   */
  unionWith(e) {
    let n = new $(se.comparator);
    for (const s of this.fields) n = n.add(s);
    for (const s of e) n = n.add(s);
    return new xe(n.toArray());
  }
  /**
   * Verifies that `fieldPath` is included by at least one field in this field
   * mask.
   *
   * This is an O(n) operation, where `n` is the size of the field mask.
   */
  covers(e) {
    for (const n of this.fields) if (n.isPrefixOf(e)) return !0;
    return !1;
  }
  isEqual(e) {
    return Ye(this.fields, e.fields, (n, s) => n.isEqual(s));
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ue {
  constructor(e) {
    this.value = e;
  }
  static empty() {
    return new ue({
      mapValue: {}
    });
  }
  /**
   * Returns the value at the given path or null.
   *
   * @param path - the path to search
   * @returns The value at the path or null if the path is not set.
   */
  field(e) {
    if (e.isEmpty()) return this.value;
    {
      let n = this.value;
      for (let s = 0; s < e.length - 1; ++s) if (n = (n.mapValue.fields || {})[e.get(s)], !ns(n)) return null;
      return n = (n.mapValue.fields || {})[e.lastSegment()], n || null;
    }
  }
  /**
   * Sets the field to the provided value.
   *
   * @param path - The field path to set.
   * @param value - The value to set.
   */
  set(e, n) {
    this.getFieldsMap(e.popLast())[e.lastSegment()] = mt(n);
  }
  /**
   * Sets the provided fields to the provided values.
   *
   * @param data - A map of fields to values (or null for deletes).
   */
  setAll(e) {
    let n = se.emptyPath(), s = {}, r = [];
    e.forEach((o, a) => {
      if (!n.isImmediateParentOf(a)) {
        const u = this.getFieldsMap(n);
        this.applyChanges(u, s, r), s = {}, r = [], n = a.popLast();
      }
      o ? s[a.lastSegment()] = mt(o) : r.push(a.lastSegment());
    });
    const i = this.getFieldsMap(n);
    this.applyChanges(i, s, r);
  }
  /**
   * Removes the field at the specified path. If there is no field at the
   * specified path, nothing is changed.
   *
   * @param path - The field path to remove.
   */
  delete(e) {
    const n = this.field(e.popLast());
    ns(n) && n.mapValue.fields && delete n.mapValue.fields[e.lastSegment()];
  }
  isEqual(e) {
    return he(this.value, e.value);
  }
  /**
   * Returns the map that contains the leaf element of `path`. If the parent
   * entry does not yet exist, or if it is not a map, a new map will be created.
   */
  getFieldsMap(e) {
    let n = this.value;
    n.mapValue.fields || (n.mapValue = {
      fields: {}
    });
    for (let s = 0; s < e.length; ++s) {
      let r = n.mapValue.fields[e.get(s)];
      ns(r) && r.mapValue.fields || (r = {
        mapValue: {
          fields: {}
        }
      }, n.mapValue.fields[e.get(s)] = r), n = r;
    }
    return n.mapValue.fields;
  }
  /**
   * Modifies `fieldsMap` by adding, replacing or deleting the specified
   * entries.
   */
  applyChanges(e, n, s) {
    Mn(n, (r, i) => e[r] = i);
    for (const r of s) delete e[r];
  }
  clone() {
    return new ue(mt(this.value));
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Q {
  constructor(e, n, s, r, i, o, a) {
    this.key = e, this.documentType = n, this.version = s, this.readTime = r, this.createTime = i, this.data = o, this.documentState = a;
  }
  /**
   * Creates a document with no known version or data, but which can serve as
   * base document for mutations.
   */
  static newInvalidDocument(e) {
    return new Q(
      e,
      0,
      /* version */
      b.min(),
      /* readTime */
      b.min(),
      /* createTime */
      b.min(),
      ue.empty(),
      0
      /* DocumentState.SYNCED */
    );
  }
  /**
   * Creates a new document that is known to exist with the given data at the
   * given version.
   */
  static newFoundDocument(e, n, s, r) {
    return new Q(
      e,
      1,
      /* version */
      n,
      /* readTime */
      b.min(),
      /* createTime */
      s,
      r,
      0
      /* DocumentState.SYNCED */
    );
  }
  /** Creates a new document that is known to not exist at the given version. */
  static newNoDocument(e, n) {
    return new Q(
      e,
      2,
      /* version */
      n,
      /* readTime */
      b.min(),
      /* createTime */
      b.min(),
      ue.empty(),
      0
      /* DocumentState.SYNCED */
    );
  }
  /**
   * Creates a new document that is known to exist at the given version but
   * whose data is not known (e.g. a document that was updated without a known
   * base document).
   */
  static newUnknownDocument(e, n) {
    return new Q(
      e,
      3,
      /* version */
      n,
      /* readTime */
      b.min(),
      /* createTime */
      b.min(),
      ue.empty(),
      2
      /* DocumentState.HAS_COMMITTED_MUTATIONS */
    );
  }
  /**
   * Changes the document type to indicate that it exists and that its version
   * and data are known.
   */
  convertToFoundDocument(e, n) {
    return !this.createTime.isEqual(b.min()) || this.documentType !== 2 && this.documentType !== 0 || (this.createTime = e), this.version = e, this.documentType = 1, this.data = n, this.documentState = 0, this;
  }
  /**
   * Changes the document type to indicate that it doesn't exist at the given
   * version.
   */
  convertToNoDocument(e) {
    return this.version = e, this.documentType = 2, this.data = ue.empty(), this.documentState = 0, this;
  }
  /**
   * Changes the document type to indicate that it exists at a given version but
   * that its data is not known (e.g. a document that was updated without a known
   * base document).
   */
  convertToUnknownDocument(e) {
    return this.version = e, this.documentType = 3, this.data = ue.empty(), this.documentState = 2, this;
  }
  setHasCommittedMutations() {
    return this.documentState = 2, this;
  }
  setHasLocalMutations() {
    return this.documentState = 1, this.version = b.min(), this;
  }
  setReadTime(e) {
    return this.readTime = e, this;
  }
  get hasLocalMutations() {
    return this.documentState === 1;
  }
  get hasCommittedMutations() {
    return this.documentState === 2;
  }
  get hasPendingWrites() {
    return this.hasLocalMutations || this.hasCommittedMutations;
  }
  isValidDocument() {
    return this.documentType !== 0;
  }
  isFoundDocument() {
    return this.documentType === 1;
  }
  isNoDocument() {
    return this.documentType === 2;
  }
  isUnknownDocument() {
    return this.documentType === 3;
  }
  isEqual(e) {
    return e instanceof Q && this.key.isEqual(e.key) && this.version.isEqual(e.version) && this.documentType === e.documentType && this.documentState === e.documentState && this.data.isEqual(e.data);
  }
  mutableCopy() {
    return new Q(this.key, this.documentType, this.version, this.readTime, this.createTime, this.data.clone(), this.documentState);
  }
  toString() {
    return `Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`;
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Xh {
  constructor(e, n = null, s = [], r = [], i = null, o = null, a = null) {
    this.path = e, this.collectionGroup = n, this.orderBy = s, this.filters = r, this.limit = i, this.startAt = o, this.endAt = a, this.ft = null;
  }
}
function si(t, e = null, n = [], s = [], r = null, i = null, o = null) {
  return new Xh(t, e, n, s, r, i, o);
}
function cr(t) {
  const e = A(t);
  if (e.ft === null) {
    let n = e.path.canonicalString();
    e.collectionGroup !== null && (n += "|cg:" + e.collectionGroup), n += "|f:", n += e.filters.map((s) => Jo(s)).join(","), n += "|ob:", n += e.orderBy.map((s) => function(r) {
      return r.field.canonicalString() + r.dir;
    }(s)).join(","), Pn(e.limit) || (n += "|l:", n += e.limit), e.startAt && (n += "|lb:", n += e.startAt.inclusive ? "b:" : "a:", n += e.startAt.position.map((s) => et(s)).join(",")), e.endAt && (n += "|ub:", n += e.endAt.inclusive ? "a:" : "b:", n += e.endAt.position.map((s) => et(s)).join(",")), e.ft = n;
  }
  return e.ft;
}
function hr(t, e) {
  if (t.limit !== e.limit || t.orderBy.length !== e.orderBy.length) return !1;
  for (let n = 0; n < t.orderBy.length; n++) if (!Qh(t.orderBy[n], e.orderBy[n])) return !1;
  if (t.filters.length !== e.filters.length) return !1;
  for (let n = 0; n < t.filters.length; n++) if (!Zo(t.filters[n], e.filters[n])) return !1;
  return t.collectionGroup === e.collectionGroup && !!t.path.isEqual(e.path) && !!ti(t.startAt, e.startAt) && ti(t.endAt, e.endAt);
}
function Ds(t) {
  return v.isDocumentKey(t.path) && t.collectionGroup === null && t.filters.length === 0;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Fn {
  /**
   * Initializes a Query with a path and optional additional query constraints.
   * Path must currently be empty if this is a collection group query.
   */
  constructor(e, n = null, s = [], r = [], i = null, o = "F", a = null, u = null) {
    this.path = e, this.collectionGroup = n, this.explicitOrderBy = s, this.filters = r, this.limit = i, this.limitType = o, this.startAt = a, this.endAt = u, this.dt = null, // The corresponding `Target` of this `Query` instance.
    this._t = null, this.startAt, this.endAt;
  }
}
function Yh(t, e, n, s, r, i, o, a) {
  return new Fn(t, e, n, s, r, i, o, a);
}
function na(t) {
  return new Fn(t);
}
function ri(t) {
  return t.filters.length === 0 && t.limit === null && t.startAt == null && t.endAt == null && (t.explicitOrderBy.length === 0 || t.explicitOrderBy.length === 1 && t.explicitOrderBy[0].field.isKeyField());
}
function Jh(t) {
  return t.explicitOrderBy.length > 0 ? t.explicitOrderBy[0].field : null;
}
function Zh(t) {
  for (const e of t.filters) {
    const n = e.getFirstInequalityField();
    if (n !== null) return n;
  }
  return null;
}
function el(t) {
  return t.collectionGroup !== null;
}
function Ke(t) {
  const e = A(t);
  if (e.dt === null) {
    e.dt = [];
    const n = Zh(e), s = Jh(e);
    if (n !== null && s === null)
      n.isKeyField() || e.dt.push(new yt(n)), e.dt.push(new yt(
        se.keyField(),
        "asc"
        /* Direction.ASCENDING */
      ));
    else {
      let r = !1;
      for (const i of e.explicitOrderBy) e.dt.push(i), i.field.isKeyField() && (r = !0);
      if (!r) {
        const i = e.explicitOrderBy.length > 0 ? e.explicitOrderBy[e.explicitOrderBy.length - 1].dir : "asc";
        e.dt.push(new yt(se.keyField(), i));
      }
    }
  }
  return e.dt;
}
function me(t) {
  const e = A(t);
  if (!e._t) if (e.limitType === "F") e._t = si(e.path, e.collectionGroup, Ke(e), e.filters, e.limit, e.startAt, e.endAt);
  else {
    const n = [];
    for (const i of Ke(e)) {
      const o = i.dir === "desc" ? "asc" : "desc";
      n.push(new yt(i.field, o));
    }
    const s = e.endAt ? new fn(e.endAt.position, e.endAt.inclusive) : null, r = e.startAt ? new fn(e.startAt.position, e.startAt.inclusive) : null;
    e._t = si(e.path, e.collectionGroup, n, e.filters, e.limit, s, r);
  }
  return e._t;
}
function ks(t, e, n) {
  return new Fn(t.path, t.collectionGroup, t.explicitOrderBy.slice(), t.filters.slice(), e, n, t.startAt, t.endAt);
}
function Un(t, e) {
  return hr(me(t), me(e)) && t.limitType === e.limitType;
}
function sa(t) {
  return `${cr(me(t))}|lt:${t.limitType}`;
}
function Rs(t) {
  return `Query(target=${function(e) {
    let n = e.path.canonicalString();
    return e.collectionGroup !== null && (n += " collectionGroup=" + e.collectionGroup), e.filters.length > 0 && (n += `, filters: [${e.filters.map((s) => ea(s)).join(", ")}]`), Pn(e.limit) || (n += ", limit: " + e.limit), e.orderBy.length > 0 && (n += `, orderBy: [${e.orderBy.map((s) => function(r) {
      return `${r.field.canonicalString()} (${r.dir})`;
    }(s)).join(", ")}]`), e.startAt && (n += ", startAt: ", n += e.startAt.inclusive ? "b:" : "a:", n += e.startAt.position.map((s) => et(s)).join(",")), e.endAt && (n += ", endAt: ", n += e.endAt.inclusive ? "a:" : "b:", n += e.endAt.position.map((s) => et(s)).join(",")), `Target(${n})`;
  }(me(t))}; limitType=${t.limitType})`;
}
function lr(t, e) {
  return e.isFoundDocument() && function(n, s) {
    const r = s.key.path;
    return n.collectionGroup !== null ? s.key.hasCollectionId(n.collectionGroup) && n.path.isPrefixOf(r) : v.isDocumentKey(n.path) ? n.path.isEqual(r) : n.path.isImmediateParentOf(r);
  }(t, e) && function(n, s) {
    for (const r of Ke(n))
      if (!r.field.isKeyField() && s.data.field(r.field) === null) return !1;
    return !0;
  }(t, e) && function(n, s) {
    for (const r of n.filters) if (!r.matches(s)) return !1;
    return !0;
  }(t, e) && function(n, s) {
    return !(n.startAt && !/**
    * Returns true if a document sorts before a bound using the provided sort
    * order.
    */
    function(r, i, o) {
      const a = ei(r, i, o);
      return r.inclusive ? a <= 0 : a < 0;
    }(n.startAt, Ke(n), s) || n.endAt && !function(r, i, o) {
      const a = ei(r, i, o);
      return r.inclusive ? a >= 0 : a > 0;
    }(n.endAt, Ke(n), s));
  }(t, e);
}
function tl(t) {
  return t.collectionGroup || (t.path.length % 2 == 1 ? t.path.lastSegment() : t.path.get(t.path.length - 2));
}
function ra(t) {
  return (e, n) => {
    let s = !1;
    for (const r of Ke(t)) {
      const i = nl(r, e, n);
      if (i !== 0) return i;
      s = s || r.field.isKeyField();
    }
    return 0;
  };
}
function nl(t, e, n) {
  const s = t.field.isKeyField() ? v.comparator(e.key, n.key) : function(r, i, o) {
    const a = i.data.field(r), u = o.data.field(r);
    return a !== null && u !== null ? Ze(a, u) : C();
  }(t.field, e, n);
  switch (t.dir) {
    case "asc":
      return s;
    case "desc":
      return -1 * s;
    default:
      return C();
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function sl(t, e) {
  if (t.wt) {
    if (isNaN(e)) return {
      doubleValue: "NaN"
    };
    if (e === 1 / 0) return {
      doubleValue: "Infinity"
    };
    if (e === -1 / 0) return {
      doubleValue: "-Infinity"
    };
  }
  return {
    doubleValue: Is(e) ? "-0" : e
  };
}
function rl(t) {
  return {
    integerValue: "" + t
  };
}
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Bn {
  constructor() {
    this._ = void 0;
  }
}
function il(t, e, n) {
  return t instanceof Ns ? function(s, r) {
    const i = {
      fields: {
        __type__: {
          stringValue: "server_timestamp"
        },
        __local_write_time__: {
          timestampValue: {
            seconds: s.seconds,
            nanos: s.nanoseconds
          }
        }
      }
    };
    return r && (i.fields.__previous_value__ = r), {
      mapValue: i
    };
  }(n, e) : t instanceof pn ? ia(t, e) : t instanceof gn ? oa(t, e) : function(s, r) {
    const i = al(s, r), o = ii(i) + ii(s.gt);
    return As(i) && As(s.gt) ? rl(o) : sl(s.yt, o);
  }(t, e);
}
function ol(t, e, n) {
  return t instanceof pn ? ia(t, e) : t instanceof gn ? oa(t, e) : n;
}
function al(t, e) {
  return t instanceof xs ? As(n = e) || function(s) {
    return !!s && "doubleValue" in s;
  }(n) ? e : {
    integerValue: 0
  } : null;
  var n;
}
class Ns extends Bn {
}
class pn extends Bn {
  constructor(e) {
    super(), this.elements = e;
  }
}
function ia(t, e) {
  const n = aa(e);
  for (const s of t.elements) n.some((r) => he(r, s)) || n.push(s);
  return {
    arrayValue: {
      values: n
    }
  };
}
class gn extends Bn {
  constructor(e) {
    super(), this.elements = e;
  }
}
function oa(t, e) {
  let n = aa(e);
  for (const s of t.elements) n = n.filter((r) => !he(r, s));
  return {
    arrayValue: {
      values: n
    }
  };
}
class xs extends Bn {
  constructor(e, n) {
    super(), this.yt = e, this.gt = n;
  }
}
function ii(t) {
  return F(t.integerValue || t.doubleValue);
}
function aa(t) {
  return ur(t) && t.arrayValue.values ? t.arrayValue.values.slice() : [];
}
function ul(t, e) {
  return t.field.isEqual(e.field) && function(n, s) {
    return n instanceof pn && s instanceof pn || n instanceof gn && s instanceof gn ? Ye(n.elements, s.elements, he) : n instanceof xs && s instanceof xs ? he(n.gt, s.gt) : n instanceof Ns && s instanceof Ns;
  }(t.transform, e.transform);
}
class Oe {
  constructor(e, n) {
    this.updateTime = e, this.exists = n;
  }
  /** Creates a new empty Precondition. */
  static none() {
    return new Oe();
  }
  /** Creates a new Precondition with an exists flag. */
  static exists(e) {
    return new Oe(void 0, e);
  }
  /** Creates a new Precondition based on a version a document exists at. */
  static updateTime(e) {
    return new Oe(e);
  }
  /** Returns whether this Precondition is empty. */
  get isNone() {
    return this.updateTime === void 0 && this.exists === void 0;
  }
  isEqual(e) {
    return this.exists === e.exists && (this.updateTime ? !!e.updateTime && this.updateTime.isEqual(e.updateTime) : !e.updateTime);
  }
}
function Zt(t, e) {
  return t.updateTime !== void 0 ? e.isFoundDocument() && e.version.isEqual(t.updateTime) : t.exists === void 0 || t.exists === e.isFoundDocument();
}
class dr {
}
function ua(t, e) {
  if (!t.hasLocalMutations || e && e.fields.length === 0) return null;
  if (e === null) return t.isNoDocument() ? new hl(t.key, Oe.none()) : new fr(t.key, t.data, Oe.none());
  {
    const n = t.data, s = ue.empty();
    let r = new $(se.comparator);
    for (let i of e.fields) if (!r.has(i)) {
      let o = n.field(i);
      o === null && i.length > 1 && (i = i.popLast(), o = n.field(i)), o === null ? s.delete(i) : s.set(i, o), r = r.add(i);
    }
    return new Vn(t.key, s, new xe(r.toArray()), Oe.none());
  }
}
function cl(t, e, n) {
  t instanceof fr ? function(s, r, i) {
    const o = s.value.clone(), a = ai(s.fieldTransforms, r, i.transformResults);
    o.setAll(a), r.convertToFoundDocument(i.version, o).setHasCommittedMutations();
  }(t, e, n) : t instanceof Vn ? function(s, r, i) {
    if (!Zt(s.precondition, r))
      return void r.convertToUnknownDocument(i.version);
    const o = ai(s.fieldTransforms, r, i.transformResults), a = r.data;
    a.setAll(ca(s)), a.setAll(o), r.convertToFoundDocument(i.version, a).setHasCommittedMutations();
  }(t, e, n) : function(s, r, i) {
    r.convertToNoDocument(i.version).setHasCommittedMutations();
  }(0, e, n);
}
function vt(t, e, n, s) {
  return t instanceof fr ? function(r, i, o, a) {
    if (!Zt(r.precondition, i))
      return o;
    const u = r.value.clone(), c = ui(r.fieldTransforms, a, i);
    return u.setAll(c), i.convertToFoundDocument(i.version, u).setHasLocalMutations(), null;
  }(t, e, n, s) : t instanceof Vn ? function(r, i, o, a) {
    if (!Zt(r.precondition, i)) return o;
    const u = ui(r.fieldTransforms, a, i), c = i.data;
    return c.setAll(ca(r)), c.setAll(u), i.convertToFoundDocument(i.version, c).setHasLocalMutations(), o === null ? null : o.unionWith(r.fieldMask.fields).unionWith(r.fieldTransforms.map((h) => h.field));
  }(t, e, n, s) : function(r, i, o) {
    return Zt(r.precondition, i) ? (i.convertToNoDocument(i.version).setHasLocalMutations(), null) : o;
  }(t, e, n);
}
function oi(t, e) {
  return t.type === e.type && !!t.key.isEqual(e.key) && !!t.precondition.isEqual(e.precondition) && !!function(n, s) {
    return n === void 0 && s === void 0 || !(!n || !s) && Ye(n, s, (r, i) => ul(r, i));
  }(t.fieldTransforms, e.fieldTransforms) && (t.type === 0 ? t.value.isEqual(e.value) : t.type !== 1 || t.data.isEqual(e.data) && t.fieldMask.isEqual(e.fieldMask));
}
class fr extends dr {
  constructor(e, n, s, r = []) {
    super(), this.key = e, this.value = n, this.precondition = s, this.fieldTransforms = r, this.type = 0;
  }
  getFieldMask() {
    return null;
  }
}
class Vn extends dr {
  constructor(e, n, s, r, i = []) {
    super(), this.key = e, this.data = n, this.fieldMask = s, this.precondition = r, this.fieldTransforms = i, this.type = 1;
  }
  getFieldMask() {
    return this.fieldMask;
  }
}
function ca(t) {
  const e = /* @__PURE__ */ new Map();
  return t.fieldMask.fields.forEach((n) => {
    if (!n.isEmpty()) {
      const s = t.data.field(n);
      e.set(n, s);
    }
  }), e;
}
function ai(t, e, n) {
  const s = /* @__PURE__ */ new Map();
  U(t.length === n.length);
  for (let r = 0; r < n.length; r++) {
    const i = t[r], o = i.transform, a = e.data.field(i.field);
    s.set(i.field, ol(o, a, n[r]));
  }
  return s;
}
function ui(t, e, n) {
  const s = /* @__PURE__ */ new Map();
  for (const r of t) {
    const i = r.transform, o = n.data.field(r.field);
    s.set(r.field, il(i, o, e));
  }
  return s;
}
class hl extends dr {
  constructor(e, n) {
    super(), this.key = e, this.precondition = n, this.type = 2, this.fieldTransforms = [];
  }
  getFieldMask() {
    return null;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ll {
  // TODO(b/33078163): just use simplest form of existence filter for now
  constructor(e) {
    this.count = e;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var P, S;
function ha(t) {
  if (t === void 0)
    return ge("GRPC error has no .code"), p.UNKNOWN;
  switch (t) {
    case P.OK:
      return p.OK;
    case P.CANCELLED:
      return p.CANCELLED;
    case P.UNKNOWN:
      return p.UNKNOWN;
    case P.DEADLINE_EXCEEDED:
      return p.DEADLINE_EXCEEDED;
    case P.RESOURCE_EXHAUSTED:
      return p.RESOURCE_EXHAUSTED;
    case P.INTERNAL:
      return p.INTERNAL;
    case P.UNAVAILABLE:
      return p.UNAVAILABLE;
    case P.UNAUTHENTICATED:
      return p.UNAUTHENTICATED;
    case P.INVALID_ARGUMENT:
      return p.INVALID_ARGUMENT;
    case P.NOT_FOUND:
      return p.NOT_FOUND;
    case P.ALREADY_EXISTS:
      return p.ALREADY_EXISTS;
    case P.PERMISSION_DENIED:
      return p.PERMISSION_DENIED;
    case P.FAILED_PRECONDITION:
      return p.FAILED_PRECONDITION;
    case P.ABORTED:
      return p.ABORTED;
    case P.OUT_OF_RANGE:
      return p.OUT_OF_RANGE;
    case P.UNIMPLEMENTED:
      return p.UNIMPLEMENTED;
    case P.DATA_LOSS:
      return p.DATA_LOSS;
    default:
      return C();
  }
}
(S = P || (P = {}))[S.OK = 0] = "OK", S[S.CANCELLED = 1] = "CANCELLED", S[S.UNKNOWN = 2] = "UNKNOWN", S[S.INVALID_ARGUMENT = 3] = "INVALID_ARGUMENT", S[S.DEADLINE_EXCEEDED = 4] = "DEADLINE_EXCEEDED", S[S.NOT_FOUND = 5] = "NOT_FOUND", S[S.ALREADY_EXISTS = 6] = "ALREADY_EXISTS", S[S.PERMISSION_DENIED = 7] = "PERMISSION_DENIED", S[S.UNAUTHENTICATED = 16] = "UNAUTHENTICATED", S[S.RESOURCE_EXHAUSTED = 8] = "RESOURCE_EXHAUSTED", S[S.FAILED_PRECONDITION = 9] = "FAILED_PRECONDITION", S[S.ABORTED = 10] = "ABORTED", S[S.OUT_OF_RANGE = 11] = "OUT_OF_RANGE", S[S.UNIMPLEMENTED = 12] = "UNIMPLEMENTED", S[S.INTERNAL = 13] = "INTERNAL", S[S.UNAVAILABLE = 14] = "UNAVAILABLE", S[S.DATA_LOSS = 15] = "DATA_LOSS";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ot {
  constructor(e, n) {
    this.mapKeyFn = e, this.equalsFn = n, /**
     * The inner map for a key/value pair. Due to the possibility of collisions we
     * keep a list of entries that we do a linear search through to find an actual
     * match. Note that collisions should be rare, so we still expect near
     * constant time lookups in practice.
     */
    this.inner = {}, /** The number of entries stored in the map */
    this.innerSize = 0;
  }
  /** Get a value for this key, or undefined if it does not exist. */
  get(e) {
    const n = this.mapKeyFn(e), s = this.inner[n];
    if (s !== void 0) {
      for (const [r, i] of s) if (this.equalsFn(r, e)) return i;
    }
  }
  has(e) {
    return this.get(e) !== void 0;
  }
  /** Put this key and value in the map. */
  set(e, n) {
    const s = this.mapKeyFn(e), r = this.inner[s];
    if (r === void 0) return this.inner[s] = [[e, n]], void this.innerSize++;
    for (let i = 0; i < r.length; i++) if (this.equalsFn(r[i][0], e))
      return void (r[i] = [e, n]);
    r.push([e, n]), this.innerSize++;
  }
  /**
   * Remove this key from the map. Returns a boolean if anything was deleted.
   */
  delete(e) {
    const n = this.mapKeyFn(e), s = this.inner[n];
    if (s === void 0) return !1;
    for (let r = 0; r < s.length; r++) if (this.equalsFn(s[r][0], e)) return s.length === 1 ? delete this.inner[n] : s.splice(r, 1), this.innerSize--, !0;
    return !1;
  }
  forEach(e) {
    Mn(this.inner, (n, s) => {
      for (const [r, i] of s) e(r, i);
    });
  }
  isEmpty() {
    return Fh(this.inner);
  }
  size() {
    return this.innerSize;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const dl = new z(v.comparator);
function Ce() {
  return dl;
}
const la = new z(v.comparator);
function pt(...t) {
  let e = la;
  for (const n of t) e = e.insert(n.key, n);
  return e;
}
function fl(t) {
  let e = la;
  return t.forEach((n, s) => e = e.insert(n, s.overlayedDocument)), e;
}
function ke() {
  return wt();
}
function da() {
  return wt();
}
function wt() {
  return new ot((t) => t.toString(), (t, e) => t.isEqual(e));
}
const pl = new $(v.comparator);
function _(...t) {
  let e = pl;
  for (const n of t) e = e.add(n);
  return e;
}
const gl = new $(R);
function fa() {
  return gl;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class $n {
  constructor(e, n, s, r, i) {
    this.snapshotVersion = e, this.targetChanges = n, this.targetMismatches = s, this.documentUpdates = r, this.resolvedLimboDocuments = i;
  }
  /**
   * HACK: Views require RemoteEvents in order to determine whether the view is
   * CURRENT, but secondary tabs don't receive remote events. So this method is
   * used to create a synthesized RemoteEvent that can be used to apply a
   * CURRENT status change to a View, for queries executed in a different tab.
   */
  // PORTING NOTE: Multi-tab only
  static createSynthesizedRemoteEventForCurrentChange(e, n, s) {
    const r = /* @__PURE__ */ new Map();
    return r.set(e, Vt.createSynthesizedTargetChangeForCurrentChange(e, n, s)), new $n(b.min(), r, fa(), Ce(), _());
  }
}
class Vt {
  constructor(e, n, s, r, i) {
    this.resumeToken = e, this.current = n, this.addedDocuments = s, this.modifiedDocuments = r, this.removedDocuments = i;
  }
  /**
   * This method is used to create a synthesized TargetChanges that can be used to
   * apply a CURRENT status change to a View (for queries executed in a different
   * tab) or for new queries (to raise snapshots with correct CURRENT status).
   */
  static createSynthesizedTargetChangeForCurrentChange(e, n, s) {
    return new Vt(s, n, _(), _(), _());
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class en {
  constructor(e, n, s, r) {
    this.It = e, this.removedTargetIds = n, this.key = s, this.Tt = r;
  }
}
class pa {
  constructor(e, n) {
    this.targetId = e, this.Et = n;
  }
}
class ga {
  constructor(e, n, s = J.EMPTY_BYTE_STRING, r = null) {
    this.state = e, this.targetIds = n, this.resumeToken = s, this.cause = r;
  }
}
class ci {
  constructor() {
    this.At = 0, /**
     * Keeps track of the document changes since the last raised snapshot.
     *
     * These changes are continuously updated as we receive document updates and
     * always reflect the current set of changes against the last issued snapshot.
     */
    this.Rt = li(), /** See public getters for explanations of these fields. */
    this.bt = J.EMPTY_BYTE_STRING, this.Pt = !1, /**
     * Whether this target state should be included in the next snapshot. We
     * initialize to true so that newly-added targets are included in the next
     * RemoteEvent.
     */
    this.vt = !0;
  }
  /**
   * Whether this target has been marked 'current'.
   *
   * 'Current' has special meaning in the RPC protocol: It implies that the
   * Watch backend has sent us all changes up to the point at which the target
   * was added and that the target is consistent with the rest of the watch
   * stream.
   */
  get current() {
    return this.Pt;
  }
  /** The last resume token sent to us for this target. */
  get resumeToken() {
    return this.bt;
  }
  /** Whether this target has pending target adds or target removes. */
  get Vt() {
    return this.At !== 0;
  }
  /** Whether we have modified any state that should trigger a snapshot. */
  get St() {
    return this.vt;
  }
  /**
   * Applies the resume token to the TargetChange, but only when it has a new
   * value. Empty resumeTokens are discarded.
   */
  Dt(e) {
    e.approximateByteSize() > 0 && (this.vt = !0, this.bt = e);
  }
  /**
   * Creates a target change from the current set of changes.
   *
   * To reset the document changes after raising this snapshot, call
   * `clearPendingChanges()`.
   */
  Ct() {
    let e = _(), n = _(), s = _();
    return this.Rt.forEach((r, i) => {
      switch (i) {
        case 0:
          e = e.add(r);
          break;
        case 2:
          n = n.add(r);
          break;
        case 1:
          s = s.add(r);
          break;
        default:
          C();
      }
    }), new Vt(this.bt, this.Pt, e, n, s);
  }
  /**
   * Resets the document changes and sets `hasPendingChanges` to false.
   */
  xt() {
    this.vt = !1, this.Rt = li();
  }
  Nt(e, n) {
    this.vt = !0, this.Rt = this.Rt.insert(e, n);
  }
  kt(e) {
    this.vt = !0, this.Rt = this.Rt.remove(e);
  }
  Ot() {
    this.At += 1;
  }
  Mt() {
    this.At -= 1;
  }
  Ft() {
    this.vt = !0, this.Pt = !0;
  }
}
class ml {
  constructor(e) {
    this.$t = e, /** The internal state of all tracked targets. */
    this.Bt = /* @__PURE__ */ new Map(), /** Keeps track of the documents to update since the last raised snapshot. */
    this.Lt = Ce(), /** A mapping of document keys to their set of target IDs. */
    this.qt = hi(), /**
     * A list of targets with existence filter mismatches. These targets are
     * known to be inconsistent and their listens needs to be re-established by
     * RemoteStore.
     */
    this.Ut = new $(R);
  }
  /**
   * Processes and adds the DocumentWatchChange to the current set of changes.
   */
  Kt(e) {
    for (const n of e.It) e.Tt && e.Tt.isFoundDocument() ? this.Gt(n, e.Tt) : this.Qt(n, e.key, e.Tt);
    for (const n of e.removedTargetIds) this.Qt(n, e.key, e.Tt);
  }
  /** Processes and adds the WatchTargetChange to the current set of changes. */
  jt(e) {
    this.forEachTarget(e, (n) => {
      const s = this.Wt(n);
      switch (e.state) {
        case 0:
          this.zt(n) && s.Dt(e.resumeToken);
          break;
        case 1:
          s.Mt(), s.Vt || // We have a freshly added target, so we need to reset any state
          // that we had previously. This can happen e.g. when remove and add
          // back a target for existence filter mismatches.
          s.xt(), s.Dt(e.resumeToken);
          break;
        case 2:
          s.Mt(), s.Vt || this.removeTarget(n);
          break;
        case 3:
          this.zt(n) && (s.Ft(), s.Dt(e.resumeToken));
          break;
        case 4:
          this.zt(n) && // Reset the target and synthesizes removes for all existing
          // documents. The backend will re-add any documents that still
          // match the target before it sends the next global snapshot.
          (this.Ht(n), s.Dt(e.resumeToken));
          break;
        default:
          C();
      }
    });
  }
  /**
   * Iterates over all targetIds that the watch change applies to: either the
   * targetIds explicitly listed in the change or the targetIds of all currently
   * active targets.
   */
  forEachTarget(e, n) {
    e.targetIds.length > 0 ? e.targetIds.forEach(n) : this.Bt.forEach((s, r) => {
      this.zt(r) && n(r);
    });
  }
  /**
   * Handles existence filters and synthesizes deletes for filter mismatches.
   * Targets that are invalidated by filter mismatches are added to
   * `pendingTargetResets`.
   */
  Jt(e) {
    const n = e.targetId, s = e.Et.count, r = this.Yt(n);
    if (r) {
      const i = r.target;
      if (Ds(i)) if (s === 0) {
        const o = new v(i.path);
        this.Qt(n, o, Q.newNoDocument(o, b.min()));
      } else U(s === 1);
      else
        this.Xt(n) !== s && // Existence filter mismatch: We reset the mapping and raise a new
        // snapshot with `isFromCache:true`.
        (this.Ht(n), this.Ut = this.Ut.add(n));
    }
  }
  /**
   * Converts the currently accumulated state into a remote event at the
   * provided snapshot version. Resets the accumulated changes before returning.
   */
  Zt(e) {
    const n = /* @__PURE__ */ new Map();
    this.Bt.forEach((i, o) => {
      const a = this.Yt(o);
      if (a) {
        if (i.current && Ds(a.target)) {
          const u = new v(a.target.path);
          this.Lt.get(u) !== null || this.te(o, u) || this.Qt(o, u, Q.newNoDocument(u, e));
        }
        i.St && (n.set(o, i.Ct()), i.xt());
      }
    });
    let s = _();
    this.qt.forEach((i, o) => {
      let a = !0;
      o.forEachWhile((u) => {
        const c = this.Yt(u);
        return !c || c.purpose === 2 || (a = !1, !1);
      }), a && (s = s.add(i));
    }), this.Lt.forEach((i, o) => o.setReadTime(e));
    const r = new $n(e, n, this.Ut, this.Lt, s);
    return this.Lt = Ce(), this.qt = hi(), this.Ut = new $(R), r;
  }
  /**
   * Adds the provided document to the internal list of document updates and
   * its document key to the given target's mapping.
   */
  // Visible for testing.
  Gt(e, n) {
    if (!this.zt(e)) return;
    const s = this.te(e, n.key) ? 2 : 0;
    this.Wt(e).Nt(n.key, s), this.Lt = this.Lt.insert(n.key, n), this.qt = this.qt.insert(n.key, this.ee(n.key).add(e));
  }
  /**
   * Removes the provided document from the target mapping. If the
   * document no longer matches the target, but the document's state is still
   * known (e.g. we know that the document was deleted or we received the change
   * that caused the filter mismatch), the new document can be provided
   * to update the remote document cache.
   */
  // Visible for testing.
  Qt(e, n, s) {
    if (!this.zt(e)) return;
    const r = this.Wt(e);
    this.te(e, n) ? r.Nt(
      n,
      1
      /* ChangeType.Removed */
    ) : (
      // The document may have entered and left the target before we raised a
      // snapshot, so we can just ignore the change.
      r.kt(n)
    ), this.qt = this.qt.insert(n, this.ee(n).delete(e)), s && (this.Lt = this.Lt.insert(n, s));
  }
  removeTarget(e) {
    this.Bt.delete(e);
  }
  /**
   * Returns the current count of documents in the target. This includes both
   * the number of documents that the LocalStore considers to be part of the
   * target as well as any accumulated changes.
   */
  Xt(e) {
    const n = this.Wt(e).Ct();
    return this.$t.getRemoteKeysForTarget(e).size + n.addedDocuments.size - n.removedDocuments.size;
  }
  /**
   * Increment the number of acks needed from watch before we can consider the
   * server to be 'in-sync' with the client's active targets.
   */
  Ot(e) {
    this.Wt(e).Ot();
  }
  Wt(e) {
    let n = this.Bt.get(e);
    return n || (n = new ci(), this.Bt.set(e, n)), n;
  }
  ee(e) {
    let n = this.qt.get(e);
    return n || (n = new $(R), this.qt = this.qt.insert(e, n)), n;
  }
  /**
   * Verifies that the user is still interested in this target (by calling
   * `getTargetDataForTarget()`) and that we are not waiting for pending ADDs
   * from watch.
   */
  zt(e) {
    const n = this.Yt(e) !== null;
    return n || y("WatchChangeAggregator", "Detected inactive target", e), n;
  }
  /**
   * Returns the TargetData for an active target (i.e. a target that the user
   * is still interested in that has no outstanding target change requests).
   */
  Yt(e) {
    const n = this.Bt.get(e);
    return n && n.Vt ? null : this.$t.ne(e);
  }
  /**
   * Resets the state of a Watch target to its initial state (e.g. sets
   * 'current' to false, clears the resume token and removes its target mapping
   * from all documents).
   */
  Ht(e) {
    this.Bt.set(e, new ci()), this.$t.getRemoteKeysForTarget(e).forEach((n) => {
      this.Qt(
        e,
        n,
        /*updatedDocument=*/
        null
      );
    });
  }
  /**
   * Returns whether the LocalStore considers the document to be part of the
   * specified target.
   */
  te(e, n) {
    return this.$t.getRemoteKeysForTarget(e).has(n);
  }
}
function hi() {
  return new z(v.comparator);
}
function li() {
  return new z(v.comparator);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const yl = {
  asc: "ASCENDING",
  desc: "DESCENDING"
}, vl = {
  "<": "LESS_THAN",
  "<=": "LESS_THAN_OR_EQUAL",
  ">": "GREATER_THAN",
  ">=": "GREATER_THAN_OR_EQUAL",
  "==": "EQUAL",
  "!=": "NOT_EQUAL",
  "array-contains": "ARRAY_CONTAINS",
  in: "IN",
  "not-in": "NOT_IN",
  "array-contains-any": "ARRAY_CONTAINS_ANY"
}, wl = {
  and: "AND",
  or: "OR"
};
class El {
  constructor(e, n) {
    this.databaseId = e, this.wt = n;
  }
}
function Tl(t, e) {
  return t.wt ? `${new Date(1e3 * e.seconds).toISOString().replace(/\.\d*/, "").replace("Z", "")}.${("000000000" + e.nanoseconds).slice(-9)}Z` : {
    seconds: "" + e.seconds,
    nanos: e.nanoseconds
  };
}
function bl(t, e) {
  return t.wt ? e.toBase64() : e.toUint8Array();
}
function ze(t) {
  return U(!!t), b.fromTimestamp(function(e) {
    const n = be(e);
    return new re(n.seconds, n.nanos);
  }(t));
}
function Cl(t, e) {
  return function(n) {
    return new x(["projects", n.projectId, "databases", n.database]);
  }(t).child("documents").child(e).canonicalString();
}
function ma(t) {
  const e = x.fromString(t);
  return U(Ea(e)), e;
}
function ss(t, e) {
  const n = ma(e);
  if (n.get(1) !== t.databaseId.projectId) throw new w(p.INVALID_ARGUMENT, "Tried to deserialize key from different project: " + n.get(1) + " vs " + t.databaseId.projectId);
  if (n.get(3) !== t.databaseId.database) throw new w(p.INVALID_ARGUMENT, "Tried to deserialize key from different database: " + n.get(3) + " vs " + t.databaseId.database);
  return new v(ya(n));
}
function Os(t, e) {
  return Cl(t.databaseId, e);
}
function Sl(t) {
  const e = ma(t);
  return e.length === 4 ? x.emptyPath() : ya(e);
}
function di(t) {
  return new x(["projects", t.databaseId.projectId, "databases", t.databaseId.database]).canonicalString();
}
function ya(t) {
  return U(t.length > 4 && t.get(4) === "documents"), t.popFirst(5);
}
function Il(t, e) {
  let n;
  if ("targetChange" in e) {
    e.targetChange;
    const s = function(u) {
      return u === "NO_CHANGE" ? 0 : u === "ADD" ? 1 : u === "REMOVE" ? 2 : u === "CURRENT" ? 3 : u === "RESET" ? 4 : C();
    }(e.targetChange.targetChangeType || "NO_CHANGE"), r = e.targetChange.targetIds || [], i = function(u, c) {
      return u.wt ? (U(c === void 0 || typeof c == "string"), J.fromBase64String(c || "")) : (U(c === void 0 || c instanceof Uint8Array), J.fromUint8Array(c || new Uint8Array()));
    }(t, e.targetChange.resumeToken), o = e.targetChange.cause, a = o && function(u) {
      const c = u.code === void 0 ? p.UNKNOWN : ha(u.code);
      return new w(c, u.message || "");
    }(o);
    n = new ga(s, r, i, a || null);
  } else if ("documentChange" in e) {
    e.documentChange;
    const s = e.documentChange;
    s.document, s.document.name, s.document.updateTime;
    const r = ss(t, s.document.name), i = ze(s.document.updateTime), o = s.document.createTime ? ze(s.document.createTime) : b.min(), a = new ue({
      mapValue: {
        fields: s.document.fields
      }
    }), u = Q.newFoundDocument(r, i, o, a), c = s.targetIds || [], h = s.removedTargetIds || [];
    n = new en(c, h, u.key, u);
  } else if ("documentDelete" in e) {
    e.documentDelete;
    const s = e.documentDelete;
    s.document;
    const r = ss(t, s.document), i = s.readTime ? ze(s.readTime) : b.min(), o = Q.newNoDocument(r, i), a = s.removedTargetIds || [];
    n = new en([], a, o.key, o);
  } else if ("documentRemove" in e) {
    e.documentRemove;
    const s = e.documentRemove;
    s.document;
    const r = ss(t, s.document), i = s.removedTargetIds || [];
    n = new en([], i, r, null);
  } else {
    if (!("filter" in e)) return C();
    {
      e.filter;
      const s = e.filter;
      s.targetId;
      const r = s.count || 0, i = new ll(r), o = s.targetId;
      n = new pa(o, i);
    }
  }
  return n;
}
function _l(t, e) {
  return {
    documents: [Os(t, e.path)]
  };
}
function Al(t, e) {
  const n = {
    structuredQuery: {}
  }, s = e.path;
  e.collectionGroup !== null ? (n.parent = Os(t, s), n.structuredQuery.from = [{
    collectionId: e.collectionGroup,
    allDescendants: !0
  }]) : (n.parent = Os(t, s.popLast()), n.structuredQuery.from = [{
    collectionId: s.lastSegment()
  }]);
  const r = function(u) {
    if (u.length !== 0)
      return wa(le.create(
        u,
        "and"
        /* CompositeOperator.AND */
      ));
  }(e.filters);
  r && (n.structuredQuery.where = r);
  const i = function(u) {
    if (u.length !== 0)
      return u.map((c) => (
        // visible for testing
        function(h) {
          return {
            field: qe(h.field),
            direction: Rl(h.dir)
          };
        }(c)
      ));
  }(e.orderBy);
  i && (n.structuredQuery.orderBy = i);
  const o = function(u, c) {
    return u.wt || Pn(c) ? c : {
      value: c
    };
  }(t, e.limit);
  var a;
  return o !== null && (n.structuredQuery.limit = o), e.startAt && (n.structuredQuery.startAt = {
    before: (a = e.startAt).inclusive,
    values: a.position
  }), e.endAt && (n.structuredQuery.endAt = function(u) {
    return {
      before: !u.inclusive,
      values: u.position
    };
  }(e.endAt)), n;
}
function Dl(t) {
  let e = Sl(t.parent);
  const n = t.structuredQuery, s = n.from ? n.from.length : 0;
  let r = null;
  if (s > 0) {
    U(s === 1);
    const h = n.from[0];
    h.allDescendants ? r = h.collectionId : e = e.child(h.collectionId);
  }
  let i = [];
  n.where && (i = function(h) {
    const l = va(h);
    return l instanceof le && Vh(l) ? l.getFilters() : [l];
  }(n.where));
  let o = [];
  n.orderBy && (o = n.orderBy.map((h) => function(l) {
    return new yt(
      je(l.field),
      // visible for testing
      function(f) {
        switch (f) {
          case "ASCENDING":
            return "asc";
          case "DESCENDING":
            return "desc";
          default:
            return;
        }
      }(l.direction)
    );
  }(h)));
  let a = null;
  n.limit && (a = function(h) {
    let l;
    return l = typeof h == "object" ? h.value : h, Pn(l) ? null : l;
  }(n.limit));
  let u = null;
  n.startAt && (u = function(h) {
    const l = !!h.before, f = h.values || [];
    return new fn(f, l);
  }(n.startAt));
  let c = null;
  return n.endAt && (c = function(h) {
    const l = !h.before, f = h.values || [];
    return new fn(f, l);
  }(n.endAt)), Yh(e, r, o, i, a, "F", u, c);
}
function kl(t, e) {
  const n = function(s, r) {
    switch (r) {
      case 0:
        return null;
      case 1:
        return "existence-filter-mismatch";
      case 2:
        return "limbo-document";
      default:
        return C();
    }
  }(0, e.purpose);
  return n == null ? null : {
    "goog-listen-tags": n
  };
}
function va(t) {
  return t.unaryFilter !== void 0 ? function(e) {
    switch (e.unaryFilter.op) {
      case "IS_NAN":
        const n = je(e.unaryFilter.field);
        return V.create(n, "==", {
          doubleValue: NaN
        });
      case "IS_NULL":
        const s = je(e.unaryFilter.field);
        return V.create(s, "==", {
          nullValue: "NULL_VALUE"
        });
      case "IS_NOT_NAN":
        const r = je(e.unaryFilter.field);
        return V.create(r, "!=", {
          doubleValue: NaN
        });
      case "IS_NOT_NULL":
        const i = je(e.unaryFilter.field);
        return V.create(i, "!=", {
          nullValue: "NULL_VALUE"
        });
      default:
        return C();
    }
  }(t) : t.fieldFilter !== void 0 ? function(e) {
    return V.create(je(e.fieldFilter.field), function(n) {
      switch (n) {
        case "EQUAL":
          return "==";
        case "NOT_EQUAL":
          return "!=";
        case "GREATER_THAN":
          return ">";
        case "GREATER_THAN_OR_EQUAL":
          return ">=";
        case "LESS_THAN":
          return "<";
        case "LESS_THAN_OR_EQUAL":
          return "<=";
        case "ARRAY_CONTAINS":
          return "array-contains";
        case "IN":
          return "in";
        case "NOT_IN":
          return "not-in";
        case "ARRAY_CONTAINS_ANY":
          return "array-contains-any";
        default:
          return C();
      }
    }(e.fieldFilter.op), e.fieldFilter.value);
  }(t) : t.compositeFilter !== void 0 ? function(e) {
    return le.create(e.compositeFilter.filters.map((n) => va(n)), function(n) {
      switch (n) {
        case "AND":
          return "and";
        case "OR":
          return "or";
        default:
          return C();
      }
    }(e.compositeFilter.op));
  }(t) : C();
}
function Rl(t) {
  return yl[t];
}
function Nl(t) {
  return vl[t];
}
function xl(t) {
  return wl[t];
}
function qe(t) {
  return {
    fieldPath: t.canonicalString()
  };
}
function je(t) {
  return se.fromServerFormat(t.fieldPath);
}
function wa(t) {
  return t instanceof V ? function(e) {
    if (e.op === "==") {
      if (Zr(e.value)) return {
        unaryFilter: {
          field: qe(e.field),
          op: "IS_NAN"
        }
      };
      if (Jr(e.value)) return {
        unaryFilter: {
          field: qe(e.field),
          op: "IS_NULL"
        }
      };
    } else if (e.op === "!=") {
      if (Zr(e.value)) return {
        unaryFilter: {
          field: qe(e.field),
          op: "IS_NOT_NAN"
        }
      };
      if (Jr(e.value)) return {
        unaryFilter: {
          field: qe(e.field),
          op: "IS_NOT_NULL"
        }
      };
    }
    return {
      fieldFilter: {
        field: qe(e.field),
        op: Nl(e.op),
        value: e.value
      }
    };
  }(t) : t instanceof le ? function(e) {
    const n = e.getFilters().map((s) => wa(s));
    return n.length === 1 ? n[0] : {
      compositeFilter: {
        op: xl(e.op),
        filters: n
      }
    };
  }(t) : C();
}
function Ea(t) {
  return t.length >= 4 && t.get(0) === "projects" && t.get(2) === "databases";
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ol {
  /**
   * @param batchId - The unique ID of this mutation batch.
   * @param localWriteTime - The original write time of this mutation.
   * @param baseMutations - Mutations that are used to populate the base
   * values when this mutation is applied locally. This can be used to locally
   * overwrite values that are persisted in the remote document cache. Base
   * mutations are never sent to the backend.
   * @param mutations - The user-provided mutations in this mutation batch.
   * User-provided mutations are applied both locally and remotely on the
   * backend.
   */
  constructor(e, n, s, r) {
    this.batchId = e, this.localWriteTime = n, this.baseMutations = s, this.mutations = r;
  }
  /**
   * Applies all the mutations in this MutationBatch to the specified document
   * to compute the state of the remote document
   *
   * @param document - The document to apply mutations to.
   * @param batchResult - The result of applying the MutationBatch to the
   * backend.
   */
  applyToRemoteDocument(e, n) {
    const s = n.mutationResults;
    for (let r = 0; r < this.mutations.length; r++) {
      const i = this.mutations[r];
      i.key.isEqual(e.key) && cl(i, e, s[r]);
    }
  }
  /**
   * Computes the local view of a document given all the mutations in this
   * batch.
   *
   * @param document - The document to apply mutations to.
   * @param mutatedFields - Fields that have been updated before applying this mutation batch.
   * @returns A `FieldMask` representing all the fields that are mutated.
   */
  applyToLocalView(e, n) {
    for (const s of this.baseMutations) s.key.isEqual(e.key) && (n = vt(s, e, n, this.localWriteTime));
    for (const s of this.mutations) s.key.isEqual(e.key) && (n = vt(s, e, n, this.localWriteTime));
    return n;
  }
  /**
   * Computes the local view for all provided documents given the mutations in
   * this batch. Returns a `DocumentKey` to `Mutation` map which can be used to
   * replace all the mutation applications.
   */
  applyToLocalDocumentSet(e, n) {
    const s = da();
    return this.mutations.forEach((r) => {
      const i = e.get(r.key), o = i.overlayedDocument;
      let a = this.applyToLocalView(o, i.mutatedFields);
      a = n.has(r.key) ? null : a;
      const u = ua(o, a);
      u !== null && s.set(r.key, u), o.isValidDocument() || o.convertToNoDocument(b.min());
    }), s;
  }
  keys() {
    return this.mutations.reduce((e, n) => e.add(n.key), _());
  }
  isEqual(e) {
    return this.batchId === e.batchId && Ye(this.mutations, e.mutations, (n, s) => oi(n, s)) && Ye(this.baseMutations, e.baseMutations, (n, s) => oi(n, s));
  }
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ll {
  constructor(e, n) {
    this.largestBatchId = e, this.mutation = n;
  }
  getKey() {
    return this.mutation.key;
  }
  isEqual(e) {
    return e !== null && this.mutation === e.mutation;
  }
  toString() {
    return `Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Le {
  constructor(e, n, s, r, i = b.min(), o = b.min(), a = J.EMPTY_BYTE_STRING) {
    this.target = e, this.targetId = n, this.purpose = s, this.sequenceNumber = r, this.snapshotVersion = i, this.lastLimboFreeSnapshotVersion = o, this.resumeToken = a;
  }
  /** Creates a new target data instance with an updated sequence number. */
  withSequenceNumber(e) {
    return new Le(this.target, this.targetId, this.purpose, e, this.snapshotVersion, this.lastLimboFreeSnapshotVersion, this.resumeToken);
  }
  /**
   * Creates a new target data instance with an updated resume token and
   * snapshot version.
   */
  withResumeToken(e, n) {
    return new Le(this.target, this.targetId, this.purpose, this.sequenceNumber, n, this.lastLimboFreeSnapshotVersion, e);
  }
  /**
   * Creates a new target data instance with an updated last limbo free
   * snapshot version number.
   */
  withLastLimboFreeSnapshotVersion(e) {
    return new Le(this.target, this.targetId, this.purpose, this.sequenceNumber, this.snapshotVersion, e, this.resumeToken);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ml {
  constructor(e) {
    this.ie = e;
  }
}
function Pl(t) {
  const e = Dl({
    parent: t.parent,
    structuredQuery: t.structuredQuery
  });
  return t.limitType === "LAST" ? ks(
    e,
    e.limit,
    "L"
    /* LimitType.Last */
  ) : e;
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Fl {
  constructor() {
    this.Je = new Ul();
  }
  addToCollectionParentIndex(e, n) {
    return this.Je.add(n), d.resolve();
  }
  getCollectionParents(e, n) {
    return d.resolve(this.Je.getEntries(n));
  }
  addFieldIndex(e, n) {
    return d.resolve();
  }
  deleteFieldIndex(e, n) {
    return d.resolve();
  }
  getDocumentsMatchingTarget(e, n) {
    return d.resolve(null);
  }
  getIndexType(e, n) {
    return d.resolve(
      0
      /* IndexType.NONE */
    );
  }
  getFieldIndexes(e, n) {
    return d.resolve([]);
  }
  getNextCollectionGroupToUpdate(e) {
    return d.resolve(null);
  }
  getMinOffset(e, n) {
    return d.resolve(Te.min());
  }
  getMinOffsetFromCollectionGroup(e, n) {
    return d.resolve(Te.min());
  }
  updateCollectionGroup(e, n, s) {
    return d.resolve();
  }
  updateIndexEntries(e, n) {
    return d.resolve();
  }
}
class Ul {
  constructor() {
    this.index = {};
  }
  // Returns false if the entry already existed.
  add(e) {
    const n = e.lastSegment(), s = e.popLast(), r = this.index[n] || new $(x.comparator), i = !r.has(s);
    return this.index[n] = r.add(s), i;
  }
  has(e) {
    const n = e.lastSegment(), s = e.popLast(), r = this.index[n];
    return r && r.has(s);
  }
  getEntries(e) {
    return (this.index[e] || new $(x.comparator)).toArray();
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class tt {
  constructor(e) {
    this.bn = e;
  }
  next() {
    return this.bn += 2, this.bn;
  }
  static Pn() {
    return new tt(0);
  }
  static vn() {
    return new tt(-1);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Bl {
  constructor() {
    this.changes = new ot((e) => e.toString(), (e, n) => e.isEqual(n)), this.changesApplied = !1;
  }
  /**
   * Buffers a `RemoteDocumentCache.addEntry()` call.
   *
   * You can only modify documents that have already been retrieved via
   * `getEntry()/getEntries()` (enforced via IndexedDbs `apply()`).
   */
  addEntry(e) {
    this.assertNotApplied(), this.changes.set(e.key, e);
  }
  /**
   * Buffers a `RemoteDocumentCache.removeEntry()` call.
   *
   * You can only remove documents that have already been retrieved via
   * `getEntry()/getEntries()` (enforced via IndexedDbs `apply()`).
   */
  removeEntry(e, n) {
    this.assertNotApplied(), this.changes.set(e, Q.newInvalidDocument(e).setReadTime(n));
  }
  /**
   * Looks up an entry in the cache. The buffered changes will first be checked,
   * and if no buffered change applies, this will forward to
   * `RemoteDocumentCache.getEntry()`.
   *
   * @param transaction - The transaction in which to perform any persistence
   *     operations.
   * @param documentKey - The key of the entry to look up.
   * @returns The cached document or an invalid document if we have nothing
   * cached.
   */
  getEntry(e, n) {
    this.assertNotApplied();
    const s = this.changes.get(n);
    return s !== void 0 ? d.resolve(s) : this.getFromCache(e, n);
  }
  /**
   * Looks up several entries in the cache, forwarding to
   * `RemoteDocumentCache.getEntry()`.
   *
   * @param transaction - The transaction in which to perform any persistence
   *     operations.
   * @param documentKeys - The keys of the entries to look up.
   * @returns A map of cached documents, indexed by key. If an entry cannot be
   *     found, the corresponding key will be mapped to an invalid document.
   */
  getEntries(e, n) {
    return this.getAllFromCache(e, n);
  }
  /**
   * Applies buffered changes to the underlying RemoteDocumentCache, using
   * the provided transaction.
   */
  apply(e) {
    return this.assertNotApplied(), this.changesApplied = !0, this.applyChanges(e);
  }
  /** Helper to assert this.changes is not null  */
  assertNotApplied() {
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Vl {
  constructor(e, n) {
    this.overlayedDocument = e, this.mutatedFields = n;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class $l {
  constructor(e, n, s, r) {
    this.remoteDocumentCache = e, this.mutationQueue = n, this.documentOverlayCache = s, this.indexManager = r;
  }
  /**
   * Get the local view of the document identified by `key`.
   *
   * @returns Local view of the document or null if we don't have any cached
   * state for it.
   */
  getDocument(e, n) {
    let s = null;
    return this.documentOverlayCache.getOverlay(e, n).next((r) => (s = r, this.remoteDocumentCache.getEntry(e, n))).next((r) => (s !== null && vt(s.mutation, r, xe.empty(), re.now()), r));
  }
  /**
   * Gets the local view of the documents identified by `keys`.
   *
   * If we don't have cached state for a document in `keys`, a NoDocument will
   * be stored for that key in the resulting set.
   */
  getDocuments(e, n) {
    return this.remoteDocumentCache.getEntries(e, n).next((s) => this.getLocalViewOfDocuments(e, s, _()).next(() => s));
  }
  /**
   * Similar to `getDocuments`, but creates the local view from the given
   * `baseDocs` without retrieving documents from the local store.
   *
   * @param transaction - The transaction this operation is scoped to.
   * @param docs - The documents to apply local mutations to get the local views.
   * @param existenceStateChanged - The set of document keys whose existence state
   *   is changed. This is useful to determine if some documents overlay needs
   *   to be recalculated.
   */
  getLocalViewOfDocuments(e, n, s = _()) {
    const r = ke();
    return this.populateOverlays(e, r, n).next(() => this.computeViews(e, n, r, s).next((i) => {
      let o = pt();
      return i.forEach((a, u) => {
        o = o.insert(a, u.overlayedDocument);
      }), o;
    }));
  }
  /**
   * Gets the overlayed documents for the given document map, which will include
   * the local view of those documents and a `FieldMask` indicating which fields
   * are mutated locally, `null` if overlay is a Set or Delete mutation.
   */
  getOverlayedDocuments(e, n) {
    const s = ke();
    return this.populateOverlays(e, s, n).next(() => this.computeViews(e, n, s, _()));
  }
  /**
   * Fetches the overlays for {@code docs} and adds them to provided overlay map
   * if the map does not already contain an entry for the given document key.
   */
  populateOverlays(e, n, s) {
    const r = [];
    return s.forEach((i) => {
      n.has(i) || r.push(i);
    }), this.documentOverlayCache.getOverlays(e, r).next((i) => {
      i.forEach((o, a) => {
        n.set(o, a);
      });
    });
  }
  /**
   * Computes the local view for the given documents.
   *
   * @param docs - The documents to compute views for. It also has the base
   *   version of the documents.
   * @param overlays - The overlays that need to be applied to the given base
   *   version of the documents.
   * @param existenceStateChanged - A set of documents whose existence states
   *   might have changed. This is used to determine if we need to re-calculate
   *   overlays from mutation queues.
   * @return A map represents the local documents view.
   */
  computeViews(e, n, s, r) {
    let i = Ce();
    const o = wt(), a = wt();
    return n.forEach((u, c) => {
      const h = s.get(c.key);
      r.has(c.key) && (h === void 0 || h.mutation instanceof Vn) ? i = i.insert(c.key, c) : h !== void 0 && (o.set(c.key, h.mutation.getFieldMask()), vt(h.mutation, c, h.mutation.getFieldMask(), re.now()));
    }), this.recalculateAndSaveOverlays(e, i).next((u) => (u.forEach((c, h) => o.set(c, h)), n.forEach((c, h) => {
      var l;
      return a.set(c, new Vl(h, (l = o.get(c)) !== null && l !== void 0 ? l : null));
    }), a));
  }
  recalculateAndSaveOverlays(e, n) {
    const s = wt();
    let r = new z((o, a) => o - a), i = _();
    return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e, n).next((o) => {
      for (const a of o) a.keys().forEach((u) => {
        const c = n.get(u);
        if (c === null) return;
        let h = s.get(u) || xe.empty();
        h = a.applyToLocalView(c, h), s.set(u, h);
        const l = (r.get(a.batchId) || _()).add(u);
        r = r.insert(a.batchId, l);
      });
    }).next(() => {
      const o = [], a = r.getReverseIterator();
      for (; a.hasNext(); ) {
        const u = a.getNext(), c = u.key, h = u.value, l = da();
        h.forEach((f) => {
          if (!i.has(f)) {
            const g = ua(n.get(f), s.get(f));
            g !== null && l.set(f, g), i = i.add(f);
          }
        }), o.push(this.documentOverlayCache.saveOverlays(e, c, l));
      }
      return d.waitFor(o);
    }).next(() => s);
  }
  /**
   * Recalculates overlays by reading the documents from remote document cache
   * first, and saves them after they are calculated.
   */
  recalculateAndSaveOverlaysForDocumentKeys(e, n) {
    return this.remoteDocumentCache.getEntries(e, n).next((s) => this.recalculateAndSaveOverlays(e, s));
  }
  /**
   * Performs a query against the local view of all documents.
   *
   * @param transaction - The persistence transaction.
   * @param query - The query to match documents against.
   * @param offset - Read time and key to start scanning by (exclusive).
   */
  getDocumentsMatchingQuery(e, n, s) {
    return function(r) {
      return v.isDocumentKey(r.path) && r.collectionGroup === null && r.filters.length === 0;
    }(n) ? this.getDocumentsMatchingDocumentQuery(e, n.path) : el(n) ? this.getDocumentsMatchingCollectionGroupQuery(e, n, s) : this.getDocumentsMatchingCollectionQuery(e, n, s);
  }
  /**
   * Given a collection group, returns the next documents that follow the provided offset, along
   * with an updated batch ID.
   *
   * <p>The documents returned by this method are ordered by remote version from the provided
   * offset. If there are no more remote documents after the provided offset, documents with
   * mutations in order of batch id from the offset are returned. Since all documents in a batch are
   * returned together, the total number of documents returned can exceed {@code count}.
   *
   * @param transaction
   * @param collectionGroup The collection group for the documents.
   * @param offset The offset to index into.
   * @param count The number of documents to return
   * @return A LocalWriteResult with the documents that follow the provided offset and the last processed batch id.
   */
  getNextDocuments(e, n, s, r) {
    return this.remoteDocumentCache.getAllFromCollectionGroup(e, n, s, r).next((i) => {
      const o = r - i.size > 0 ? this.documentOverlayCache.getOverlaysForCollectionGroup(e, n, s.largestBatchId, r - i.size) : d.resolve(ke());
      let a = -1, u = i;
      return o.next((c) => d.forEach(c, (h, l) => (a < l.largestBatchId && (a = l.largestBatchId), i.get(h) ? d.resolve() : this.remoteDocumentCache.getEntry(e, h).next((f) => {
        u = u.insert(h, f);
      }))).next(() => this.populateOverlays(e, c, i)).next(() => this.computeViews(e, u, c, _())).next((h) => ({
        batchId: a,
        changes: fl(h)
      })));
    });
  }
  getDocumentsMatchingDocumentQuery(e, n) {
    return this.getDocument(e, new v(n)).next((s) => {
      let r = pt();
      return s.isFoundDocument() && (r = r.insert(s.key, s)), r;
    });
  }
  getDocumentsMatchingCollectionGroupQuery(e, n, s) {
    const r = n.collectionGroup;
    let i = pt();
    return this.indexManager.getCollectionParents(e, r).next((o) => d.forEach(o, (a) => {
      const u = function(c, h) {
        return new Fn(
          h,
          /*collectionGroup=*/
          null,
          c.explicitOrderBy.slice(),
          c.filters.slice(),
          c.limit,
          c.limitType,
          c.startAt,
          c.endAt
        );
      }(n, a.child(r));
      return this.getDocumentsMatchingCollectionQuery(e, u, s).next((c) => {
        c.forEach((h, l) => {
          i = i.insert(h, l);
        });
      });
    }).next(() => i));
  }
  getDocumentsMatchingCollectionQuery(e, n, s) {
    let r;
    return this.remoteDocumentCache.getAllFromCollection(e, n.path, s).next((i) => (r = i, this.documentOverlayCache.getOverlaysForCollection(e, n.path, s.largestBatchId))).next((i) => {
      i.forEach((a, u) => {
        const c = u.getKey();
        r.get(c) === null && (r = r.insert(c, Q.newInvalidDocument(c)));
      });
      let o = pt();
      return r.forEach((a, u) => {
        const c = i.get(a);
        c !== void 0 && vt(c.mutation, u, xe.empty(), re.now()), // Finally, insert the documents that still match the query
        lr(n, u) && (o = o.insert(a, u));
      }), o;
    });
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ql {
  constructor(e) {
    this.yt = e, this.Zn = /* @__PURE__ */ new Map(), this.ts = /* @__PURE__ */ new Map();
  }
  getBundleMetadata(e, n) {
    return d.resolve(this.Zn.get(n));
  }
  saveBundleMetadata(e, n) {
    var s;
    return this.Zn.set(n.id, {
      id: (s = n).id,
      version: s.version,
      createTime: ze(s.createTime)
    }), d.resolve();
  }
  getNamedQuery(e, n) {
    return d.resolve(this.ts.get(n));
  }
  saveNamedQuery(e, n) {
    return this.ts.set(n.name, function(s) {
      return {
        name: s.name,
        query: Pl(s.bundledQuery),
        readTime: ze(s.readTime)
      };
    }(n)), d.resolve();
  }
}
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class jl {
  constructor() {
    this.overlays = new z(v.comparator), this.es = /* @__PURE__ */ new Map();
  }
  getOverlay(e, n) {
    return d.resolve(this.overlays.get(n));
  }
  getOverlays(e, n) {
    const s = ke();
    return d.forEach(n, (r) => this.getOverlay(e, r).next((i) => {
      i !== null && s.set(r, i);
    })).next(() => s);
  }
  saveOverlays(e, n, s) {
    return s.forEach((r, i) => {
      this.oe(e, n, i);
    }), d.resolve();
  }
  removeOverlaysForBatchId(e, n, s) {
    const r = this.es.get(s);
    return r !== void 0 && (r.forEach((i) => this.overlays = this.overlays.remove(i)), this.es.delete(s)), d.resolve();
  }
  getOverlaysForCollection(e, n, s) {
    const r = ke(), i = n.length + 1, o = new v(n.child("")), a = this.overlays.getIteratorFrom(o);
    for (; a.hasNext(); ) {
      const u = a.getNext().value, c = u.getKey();
      if (!n.isPrefixOf(c.path)) break;
      c.path.length === i && u.largestBatchId > s && r.set(u.getKey(), u);
    }
    return d.resolve(r);
  }
  getOverlaysForCollectionGroup(e, n, s, r) {
    let i = new z((c, h) => c - h);
    const o = this.overlays.getIterator();
    for (; o.hasNext(); ) {
      const c = o.getNext().value;
      if (c.getKey().getCollectionGroup() === n && c.largestBatchId > s) {
        let h = i.get(c.largestBatchId);
        h === null && (h = ke(), i = i.insert(c.largestBatchId, h)), h.set(c.getKey(), c);
      }
    }
    const a = ke(), u = i.getIterator();
    for (; u.hasNext() && (u.getNext().value.forEach((c, h) => a.set(c, h)), !(a.size() >= r)); )
      ;
    return d.resolve(a);
  }
  oe(e, n, s) {
    const r = this.overlays.get(s.key);
    if (r !== null) {
      const o = this.es.get(r.largestBatchId).delete(s.key);
      this.es.set(r.largestBatchId, o);
    }
    this.overlays = this.overlays.insert(s.key, new Ll(n, s));
    let i = this.es.get(n);
    i === void 0 && (i = _(), this.es.set(n, i)), this.es.set(n, i.add(s.key));
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class pr {
  constructor() {
    this.ns = new $(q.ss), // A set of outstanding references to a document sorted by target id.
    this.rs = new $(q.os);
  }
  /** Returns true if the reference set contains no references. */
  isEmpty() {
    return this.ns.isEmpty();
  }
  /** Adds a reference to the given document key for the given ID. */
  addReference(e, n) {
    const s = new q(e, n);
    this.ns = this.ns.add(s), this.rs = this.rs.add(s);
  }
  /** Add references to the given document keys for the given ID. */
  us(e, n) {
    e.forEach((s) => this.addReference(s, n));
  }
  /**
   * Removes a reference to the given document key for the given
   * ID.
   */
  removeReference(e, n) {
    this.cs(new q(e, n));
  }
  hs(e, n) {
    e.forEach((s) => this.removeReference(s, n));
  }
  /**
   * Clears all references with a given ID. Calls removeRef() for each key
   * removed.
   */
  ls(e) {
    const n = new v(new x([])), s = new q(n, e), r = new q(n, e + 1), i = [];
    return this.rs.forEachInRange([s, r], (o) => {
      this.cs(o), i.push(o.key);
    }), i;
  }
  fs() {
    this.ns.forEach((e) => this.cs(e));
  }
  cs(e) {
    this.ns = this.ns.delete(e), this.rs = this.rs.delete(e);
  }
  ds(e) {
    const n = new v(new x([])), s = new q(n, e), r = new q(n, e + 1);
    let i = _();
    return this.rs.forEachInRange([s, r], (o) => {
      i = i.add(o.key);
    }), i;
  }
  containsKey(e) {
    const n = new q(e, 0), s = this.ns.firstAfterOrEqual(n);
    return s !== null && e.isEqual(s.key);
  }
}
class q {
  constructor(e, n) {
    this.key = e, this._s = n;
  }
  /** Compare by key then by ID */
  static ss(e, n) {
    return v.comparator(e.key, n.key) || R(e._s, n._s);
  }
  /** Compare by ID then by key */
  static os(e, n) {
    return R(e._s, n._s) || v.comparator(e.key, n.key);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Hl {
  constructor(e, n) {
    this.indexManager = e, this.referenceDelegate = n, /**
     * The set of all mutations that have been sent but not yet been applied to
     * the backend.
     */
    this.mutationQueue = [], /** Next value to use when assigning sequential IDs to each mutation batch. */
    this.ws = 1, /** An ordered mapping between documents and the mutations batch IDs. */
    this.gs = new $(q.ss);
  }
  checkEmpty(e) {
    return d.resolve(this.mutationQueue.length === 0);
  }
  addMutationBatch(e, n, s, r) {
    const i = this.ws;
    this.ws++, this.mutationQueue.length > 0 && this.mutationQueue[this.mutationQueue.length - 1];
    const o = new Ol(i, n, s, r);
    this.mutationQueue.push(o);
    for (const a of r) this.gs = this.gs.add(new q(a.key, i)), this.indexManager.addToCollectionParentIndex(e, a.key.path.popLast());
    return d.resolve(o);
  }
  lookupMutationBatch(e, n) {
    return d.resolve(this.ys(n));
  }
  getNextMutationBatchAfterBatchId(e, n) {
    const s = n + 1, r = this.ps(s), i = r < 0 ? 0 : r;
    return d.resolve(this.mutationQueue.length > i ? this.mutationQueue[i] : null);
  }
  getHighestUnacknowledgedBatchId() {
    return d.resolve(this.mutationQueue.length === 0 ? -1 : this.ws - 1);
  }
  getAllMutationBatches(e) {
    return d.resolve(this.mutationQueue.slice());
  }
  getAllMutationBatchesAffectingDocumentKey(e, n) {
    const s = new q(n, 0), r = new q(n, Number.POSITIVE_INFINITY), i = [];
    return this.gs.forEachInRange([s, r], (o) => {
      const a = this.ys(o._s);
      i.push(a);
    }), d.resolve(i);
  }
  getAllMutationBatchesAffectingDocumentKeys(e, n) {
    let s = new $(R);
    return n.forEach((r) => {
      const i = new q(r, 0), o = new q(r, Number.POSITIVE_INFINITY);
      this.gs.forEachInRange([i, o], (a) => {
        s = s.add(a._s);
      });
    }), d.resolve(this.Is(s));
  }
  getAllMutationBatchesAffectingQuery(e, n) {
    const s = n.path, r = s.length + 1;
    let i = s;
    v.isDocumentKey(i) || (i = i.child(""));
    const o = new q(new v(i), 0);
    let a = new $(R);
    return this.gs.forEachWhile((u) => {
      const c = u.key.path;
      return !!s.isPrefixOf(c) && // Rows with document keys more than one segment longer than the query
      // path can't be matches. For example, a query on 'rooms' can't match
      // the document /rooms/abc/messages/xyx.
      // TODO(mcg): we'll need a different scanner when we implement
      // ancestor queries.
      (c.length === r && (a = a.add(u._s)), !0);
    }, o), d.resolve(this.Is(a));
  }
  Is(e) {
    const n = [];
    return e.forEach((s) => {
      const r = this.ys(s);
      r !== null && n.push(r);
    }), n;
  }
  removeMutationBatch(e, n) {
    U(this.Ts(n.batchId, "removed") === 0), this.mutationQueue.shift();
    let s = this.gs;
    return d.forEach(n.mutations, (r) => {
      const i = new q(r.key, n.batchId);
      return s = s.delete(i), this.referenceDelegate.markPotentiallyOrphaned(e, r.key);
    }).next(() => {
      this.gs = s;
    });
  }
  An(e) {
  }
  containsKey(e, n) {
    const s = new q(n, 0), r = this.gs.firstAfterOrEqual(s);
    return d.resolve(n.isEqual(r && r.key));
  }
  performConsistencyCheck(e) {
    return this.mutationQueue.length, d.resolve();
  }
  /**
   * Finds the index of the given batchId in the mutation queue and asserts that
   * the resulting index is within the bounds of the queue.
   *
   * @param batchId - The batchId to search for
   * @param action - A description of what the caller is doing, phrased in passive
   * form (e.g. "acknowledged" in a routine that acknowledges batches).
   */
  Ts(e, n) {
    return this.ps(e);
  }
  /**
   * Finds the index of the given batchId in the mutation queue. This operation
   * is O(1).
   *
   * @returns The computed index of the batch with the given batchId, based on
   * the state of the queue. Note this index can be negative if the requested
   * batchId has already been remvoed from the queue or past the end of the
   * queue if the batchId is larger than the last added batch.
   */
  ps(e) {
    return this.mutationQueue.length === 0 ? 0 : e - this.mutationQueue[0].batchId;
  }
  /**
   * A version of lookupMutationBatch that doesn't return a promise, this makes
   * other functions that uses this code easier to read and more efficent.
   */
  ys(e) {
    const n = this.ps(e);
    return n < 0 || n >= this.mutationQueue.length ? null : this.mutationQueue[n];
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Kl {
  /**
   * @param sizer - Used to assess the size of a document. For eager GC, this is
   * expected to just return 0 to avoid unnecessarily doing the work of
   * calculating the size.
   */
  constructor(e) {
    this.Es = e, /** Underlying cache of documents and their read times. */
    this.docs = new z(v.comparator), /** Size of all cached documents. */
    this.size = 0;
  }
  setIndexManager(e) {
    this.indexManager = e;
  }
  /**
   * Adds the supplied entry to the cache and updates the cache size as appropriate.
   *
   * All calls of `addEntry`  are required to go through the RemoteDocumentChangeBuffer
   * returned by `newChangeBuffer()`.
   */
  addEntry(e, n) {
    const s = n.key, r = this.docs.get(s), i = r ? r.size : 0, o = this.Es(n);
    return this.docs = this.docs.insert(s, {
      document: n.mutableCopy(),
      size: o
    }), this.size += o - i, this.indexManager.addToCollectionParentIndex(e, s.path.popLast());
  }
  /**
   * Removes the specified entry from the cache and updates the cache size as appropriate.
   *
   * All calls of `removeEntry` are required to go through the RemoteDocumentChangeBuffer
   * returned by `newChangeBuffer()`.
   */
  removeEntry(e) {
    const n = this.docs.get(e);
    n && (this.docs = this.docs.remove(e), this.size -= n.size);
  }
  getEntry(e, n) {
    const s = this.docs.get(n);
    return d.resolve(s ? s.document.mutableCopy() : Q.newInvalidDocument(n));
  }
  getEntries(e, n) {
    let s = Ce();
    return n.forEach((r) => {
      const i = this.docs.get(r);
      s = s.insert(r, i ? i.document.mutableCopy() : Q.newInvalidDocument(r));
    }), d.resolve(s);
  }
  getAllFromCollection(e, n, s) {
    let r = Ce();
    const i = new v(n.child("")), o = this.docs.getIteratorFrom(i);
    for (; o.hasNext(); ) {
      const { key: a, value: { document: u } } = o.getNext();
      if (!n.isPrefixOf(a.path)) break;
      a.path.length > n.length + 1 || Oh(xh(u), s) <= 0 || (r = r.insert(u.key, u.mutableCopy()));
    }
    return d.resolve(r);
  }
  getAllFromCollectionGroup(e, n, s, r) {
    C();
  }
  As(e, n) {
    return d.forEach(this.docs, (s) => n(s));
  }
  newChangeBuffer(e) {
    return new zl(this);
  }
  getSize(e) {
    return d.resolve(this.size);
  }
}
class zl extends Bl {
  constructor(e) {
    super(), this.Yn = e;
  }
  applyChanges(e) {
    const n = [];
    return this.changes.forEach((s, r) => {
      r.isValidDocument() ? n.push(this.Yn.addEntry(e, r)) : this.Yn.removeEntry(s);
    }), d.waitFor(n);
  }
  getFromCache(e, n) {
    return this.Yn.getEntry(e, n);
  }
  getAllFromCache(e, n) {
    return this.Yn.getEntries(e, n);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Gl {
  constructor(e) {
    this.persistence = e, /**
     * Maps a target to the data about that target
     */
    this.Rs = new ot((n) => cr(n), hr), /** The last received snapshot version. */
    this.lastRemoteSnapshotVersion = b.min(), /** The highest numbered target ID encountered. */
    this.highestTargetId = 0, /** The highest sequence number encountered. */
    this.bs = 0, /**
     * A ordered bidirectional mapping between documents and the remote target
     * IDs.
     */
    this.Ps = new pr(), this.targetCount = 0, this.vs = tt.Pn();
  }
  forEachTarget(e, n) {
    return this.Rs.forEach((s, r) => n(r)), d.resolve();
  }
  getLastRemoteSnapshotVersion(e) {
    return d.resolve(this.lastRemoteSnapshotVersion);
  }
  getHighestSequenceNumber(e) {
    return d.resolve(this.bs);
  }
  allocateTargetId(e) {
    return this.highestTargetId = this.vs.next(), d.resolve(this.highestTargetId);
  }
  setTargetsMetadata(e, n, s) {
    return s && (this.lastRemoteSnapshotVersion = s), n > this.bs && (this.bs = n), d.resolve();
  }
  Dn(e) {
    this.Rs.set(e.target, e);
    const n = e.targetId;
    n > this.highestTargetId && (this.vs = new tt(n), this.highestTargetId = n), e.sequenceNumber > this.bs && (this.bs = e.sequenceNumber);
  }
  addTargetData(e, n) {
    return this.Dn(n), this.targetCount += 1, d.resolve();
  }
  updateTargetData(e, n) {
    return this.Dn(n), d.resolve();
  }
  removeTargetData(e, n) {
    return this.Rs.delete(n.target), this.Ps.ls(n.targetId), this.targetCount -= 1, d.resolve();
  }
  removeTargets(e, n, s) {
    let r = 0;
    const i = [];
    return this.Rs.forEach((o, a) => {
      a.sequenceNumber <= n && s.get(a.targetId) === null && (this.Rs.delete(o), i.push(this.removeMatchingKeysForTargetId(e, a.targetId)), r++);
    }), d.waitFor(i).next(() => r);
  }
  getTargetCount(e) {
    return d.resolve(this.targetCount);
  }
  getTargetData(e, n) {
    const s = this.Rs.get(n) || null;
    return d.resolve(s);
  }
  addMatchingKeys(e, n, s) {
    return this.Ps.us(n, s), d.resolve();
  }
  removeMatchingKeys(e, n, s) {
    this.Ps.hs(n, s);
    const r = this.persistence.referenceDelegate, i = [];
    return r && n.forEach((o) => {
      i.push(r.markPotentiallyOrphaned(e, o));
    }), d.waitFor(i);
  }
  removeMatchingKeysForTargetId(e, n) {
    return this.Ps.ls(n), d.resolve();
  }
  getMatchingKeysForTargetId(e, n) {
    const s = this.Ps.ds(n);
    return d.resolve(s);
  }
  containsKey(e, n) {
    return d.resolve(this.Ps.containsKey(n));
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Wl {
  /**
   * The constructor accepts a factory for creating a reference delegate. This
   * allows both the delegate and this instance to have strong references to
   * each other without having nullable fields that would then need to be
   * checked or asserted on every access.
   */
  constructor(e, n) {
    this.Vs = {}, this.overlays = {}, this.Ss = new ar(0), this.Ds = !1, this.Ds = !0, this.referenceDelegate = e(this), this.Cs = new Gl(this), this.indexManager = new Fl(), this.remoteDocumentCache = function(s) {
      return new Kl(s);
    }((s) => this.referenceDelegate.xs(s)), this.yt = new Ml(n), this.Ns = new ql(this.yt);
  }
  start() {
    return Promise.resolve();
  }
  shutdown() {
    return this.Ds = !1, Promise.resolve();
  }
  get started() {
    return this.Ds;
  }
  setDatabaseDeletedListener() {
  }
  setNetworkEnabled() {
  }
  getIndexManager(e) {
    return this.indexManager;
  }
  getDocumentOverlayCache(e) {
    let n = this.overlays[e.toKey()];
    return n || (n = new jl(), this.overlays[e.toKey()] = n), n;
  }
  getMutationQueue(e, n) {
    let s = this.Vs[e.toKey()];
    return s || (s = new Hl(n, this.referenceDelegate), this.Vs[e.toKey()] = s), s;
  }
  getTargetCache() {
    return this.Cs;
  }
  getRemoteDocumentCache() {
    return this.remoteDocumentCache;
  }
  getBundleCache() {
    return this.Ns;
  }
  runTransaction(e, n, s) {
    y("MemoryPersistence", "Starting transaction:", e);
    const r = new Ql(this.Ss.next());
    return this.referenceDelegate.ks(), s(r).next((i) => this.referenceDelegate.Os(r).next(() => i)).toPromise().then((i) => (r.raiseOnCommittedEvent(), i));
  }
  Ms(e, n) {
    return d.or(Object.values(this.Vs).map((s) => () => s.containsKey(e, n)));
  }
}
class Ql extends Mh {
  constructor(e) {
    super(), this.currentSequenceNumber = e;
  }
}
class gr {
  constructor(e) {
    this.persistence = e, /** Tracks all documents that are active in Query views. */
    this.Fs = new pr(), /** The list of documents that are potentially GCed after each transaction. */
    this.$s = null;
  }
  static Bs(e) {
    return new gr(e);
  }
  get Ls() {
    if (this.$s) return this.$s;
    throw C();
  }
  addReference(e, n, s) {
    return this.Fs.addReference(s, n), this.Ls.delete(s.toString()), d.resolve();
  }
  removeReference(e, n, s) {
    return this.Fs.removeReference(s, n), this.Ls.add(s.toString()), d.resolve();
  }
  markPotentiallyOrphaned(e, n) {
    return this.Ls.add(n.toString()), d.resolve();
  }
  removeTarget(e, n) {
    this.Fs.ls(n.targetId).forEach((r) => this.Ls.add(r.toString()));
    const s = this.persistence.getTargetCache();
    return s.getMatchingKeysForTargetId(e, n.targetId).next((r) => {
      r.forEach((i) => this.Ls.add(i.toString()));
    }).next(() => s.removeTargetData(e, n));
  }
  ks() {
    this.$s = /* @__PURE__ */ new Set();
  }
  Os(e) {
    const n = this.persistence.getRemoteDocumentCache().newChangeBuffer();
    return d.forEach(this.Ls, (s) => {
      const r = v.fromPath(s);
      return this.qs(e, r).next((i) => {
        i || n.removeEntry(r, b.min());
      });
    }).next(() => (this.$s = null, n.apply(e)));
  }
  updateLimboDocument(e, n) {
    return this.qs(e, n).next((s) => {
      s ? this.Ls.delete(n.toString()) : this.Ls.add(n.toString());
    });
  }
  xs(e) {
    return 0;
  }
  qs(e, n) {
    return d.or([() => d.resolve(this.Fs.containsKey(n)), () => this.persistence.getTargetCache().containsKey(e, n), () => this.persistence.Ms(e, n)]);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class mr {
  constructor(e, n, s, r) {
    this.targetId = e, this.fromCache = n, this.Si = s, this.Di = r;
  }
  static Ci(e, n) {
    let s = _(), r = _();
    for (const i of n.docChanges) switch (i.type) {
      case 0:
        s = s.add(i.doc.key);
        break;
      case 1:
        r = r.add(i.doc.key);
    }
    return new mr(e, n.fromCache, s, r);
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Xl {
  constructor() {
    this.xi = !1;
  }
  /** Sets the document view to query against. */
  initialize(e, n) {
    this.Ni = e, this.indexManager = n, this.xi = !0;
  }
  /** Returns all local documents matching the specified query. */
  getDocumentsMatchingQuery(e, n, s, r) {
    return this.ki(e, n).next((i) => i || this.Oi(e, n, r, s)).next((i) => i || this.Mi(e, n));
  }
  /**
   * Performs an indexed query that evaluates the query based on a collection's
   * persisted index values. Returns `null` if an index is not available.
   */
  ki(e, n) {
    if (ri(n))
      return d.resolve(null);
    let s = me(n);
    return this.indexManager.getIndexType(e, s).next((r) => r === 0 ? null : (n.limit !== null && r === 1 && // We cannot apply a limit for targets that are served using a partial
    // index. If a partial index will be used to serve the target, the
    // query may return a superset of documents that match the target
    // (e.g. if the index doesn't include all the target's filters), or
    // may return the correct set of documents in the wrong order (e.g. if
    // the index doesn't include a segment for one of the orderBys).
    // Therefore, a limit should not be applied in such cases.
    (n = ks(
      n,
      null,
      "F"
      /* LimitType.First */
    ), s = me(n)), this.indexManager.getDocumentsMatchingTarget(e, s).next((i) => {
      const o = _(...i);
      return this.Ni.getDocuments(e, o).next((a) => this.indexManager.getMinOffset(e, s).next((u) => {
        const c = this.Fi(n, a);
        return this.$i(n, c, o, u.readTime) ? this.ki(e, ks(
          n,
          null,
          "F"
          /* LimitType.First */
        )) : this.Bi(e, c, n, u);
      }));
    })));
  }
  /**
   * Performs a query based on the target's persisted query mapping. Returns
   * `null` if the mapping is not available or cannot be used.
   */
  Oi(e, n, s, r) {
    return ri(n) || r.isEqual(b.min()) ? this.Mi(e, n) : this.Ni.getDocuments(e, s).next((i) => {
      const o = this.Fi(n, i);
      return this.$i(n, o, s, r) ? this.Mi(e, n) : (Qr() <= k.DEBUG && y("QueryEngine", "Re-using previous result from %s to execute query: %s", r.toString(), Rs(n)), this.Bi(e, o, n, Nh(r, -1)));
    });
  }
  /** Applies the query filter and sorting to the provided documents.  */
  Fi(e, n) {
    let s = new $(ra(e));
    return n.forEach((r, i) => {
      lr(e, i) && (s = s.add(i));
    }), s;
  }
  /**
   * Determines if a limit query needs to be refilled from cache, making it
   * ineligible for index-free execution.
   *
   * @param query - The query.
   * @param sortedPreviousResults - The documents that matched the query when it
   * was last synchronized, sorted by the query's comparator.
   * @param remoteKeys - The document keys that matched the query at the last
   * snapshot.
   * @param limboFreeSnapshotVersion - The version of the snapshot when the
   * query was last synchronized.
   */
  $i(e, n, s, r) {
    if (e.limit === null)
      return !1;
    if (s.size !== n.size)
      return !0;
    const i = e.limitType === "F" ? n.last() : n.first();
    return !!i && (i.hasPendingWrites || i.version.compareTo(r) > 0);
  }
  Mi(e, n) {
    return Qr() <= k.DEBUG && y("QueryEngine", "Using full collection scan to execute query:", Rs(n)), this.Ni.getDocumentsMatchingQuery(e, n, Te.min());
  }
  /**
   * Combines the results from an indexed execution with the remaining documents
   * that have not yet been indexed.
   */
  Bi(e, n, s, r) {
    return this.Ni.getDocumentsMatchingQuery(e, s, r).next((i) => (
      // Merge with existing results
      (n.forEach((o) => {
        i = i.insert(o.key, o);
      }), i)
    ));
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Yl {
  constructor(e, n, s, r) {
    this.persistence = e, this.Li = n, this.yt = r, /**
     * Maps a targetID to data about its target.
     *
     * PORTING NOTE: We are using an immutable data structure on Web to make re-runs
     * of `applyRemoteEvent()` idempotent.
     */
    this.qi = new z(R), /** Maps a target to its targetID. */
    // TODO(wuandy): Evaluate if TargetId can be part of Target.
    this.Ui = new ot((i) => cr(i), hr), /**
     * A per collection group index of the last read time processed by
     * `getNewDocumentChanges()`.
     *
     * PORTING NOTE: This is only used for multi-tab synchronization.
     */
    this.Ki = /* @__PURE__ */ new Map(), this.Gi = e.getRemoteDocumentCache(), this.Cs = e.getTargetCache(), this.Ns = e.getBundleCache(), this.Qi(s);
  }
  Qi(e) {
    this.documentOverlayCache = this.persistence.getDocumentOverlayCache(e), this.indexManager = this.persistence.getIndexManager(e), this.mutationQueue = this.persistence.getMutationQueue(e, this.indexManager), this.localDocuments = new $l(this.Gi, this.mutationQueue, this.documentOverlayCache, this.indexManager), this.Gi.setIndexManager(this.indexManager), this.Li.initialize(this.localDocuments, this.indexManager);
  }
  collectGarbage(e) {
    return this.persistence.runTransaction("Collect garbage", "readwrite-primary", (n) => e.collect(n, this.qi));
  }
}
function Jl(t, e, n, s) {
  return new Yl(t, e, n, s);
}
async function Ta(t, e) {
  const n = A(t);
  return await n.persistence.runTransaction("Handle user change", "readonly", (s) => {
    let r;
    return n.mutationQueue.getAllMutationBatches(s).next((i) => (r = i, n.Qi(e), n.mutationQueue.getAllMutationBatches(s))).next((i) => {
      const o = [], a = [];
      let u = _();
      for (const c of r) {
        o.push(c.batchId);
        for (const h of c.mutations) u = u.add(h.key);
      }
      for (const c of i) {
        a.push(c.batchId);
        for (const h of c.mutations) u = u.add(h.key);
      }
      return n.localDocuments.getDocuments(s, u).next((c) => ({
        ji: c,
        removedBatchIds: o,
        addedBatchIds: a
      }));
    });
  });
}
function ba(t) {
  const e = A(t);
  return e.persistence.runTransaction("Get last remote snapshot version", "readonly", (n) => e.Cs.getLastRemoteSnapshotVersion(n));
}
function Zl(t, e) {
  const n = A(t), s = e.snapshotVersion;
  let r = n.qi;
  return n.persistence.runTransaction("Apply remote event", "readwrite-primary", (i) => {
    const o = n.Gi.newChangeBuffer({
      trackRemovals: !0
    });
    r = n.qi;
    const a = [];
    e.targetChanges.forEach((h, l) => {
      const f = r.get(l);
      if (!f) return;
      a.push(n.Cs.removeMatchingKeys(i, h.removedDocuments, l).next(() => n.Cs.addMatchingKeys(i, h.addedDocuments, l)));
      let g = f.withSequenceNumber(i.currentSequenceNumber);
      e.targetMismatches.has(l) ? g = g.withResumeToken(J.EMPTY_BYTE_STRING, b.min()).withLastLimboFreeSnapshotVersion(b.min()) : h.resumeToken.approximateByteSize() > 0 && (g = g.withResumeToken(h.resumeToken, s)), r = r.insert(l, g), // Update the target data if there are target changes (or if
      // sufficient time has passed since the last update).
      /**
      * Returns true if the newTargetData should be persisted during an update of
      * an active target. TargetData should always be persisted when a target is
      * being released and should not call this function.
      *
      * While the target is active, TargetData updates can be omitted when nothing
      * about the target has changed except metadata like the resume token or
      * snapshot version. Occasionally it's worth the extra write to prevent these
      * values from getting too stale after a crash, but this doesn't have to be
      * too frequent.
      */
      function(T, D, I) {
        return T.resumeToken.approximateByteSize() === 0 || D.snapshotVersion.toMicroseconds() - T.snapshotVersion.toMicroseconds() >= 3e8 ? !0 : I.addedDocuments.size + I.modifiedDocuments.size + I.removedDocuments.size > 0;
      }(f, g, h) && a.push(n.Cs.updateTargetData(i, g));
    });
    let u = Ce(), c = _();
    if (e.documentUpdates.forEach((h) => {
      e.resolvedLimboDocuments.has(h) && a.push(n.persistence.referenceDelegate.updateLimboDocument(i, h));
    }), // Each loop iteration only affects its "own" doc, so it's safe to get all
    // the remote documents in advance in a single call.
    a.push(ed(i, o, e.documentUpdates).next((h) => {
      u = h.Wi, c = h.zi;
    })), !s.isEqual(b.min())) {
      const h = n.Cs.getLastRemoteSnapshotVersion(i).next((l) => n.Cs.setTargetsMetadata(i, i.currentSequenceNumber, s));
      a.push(h);
    }
    return d.waitFor(a).next(() => o.apply(i)).next(() => n.localDocuments.getLocalViewOfDocuments(i, u, c)).next(() => u);
  }).then((i) => (n.qi = r, i));
}
function ed(t, e, n) {
  let s = _(), r = _();
  return n.forEach((i) => s = s.add(i)), e.getEntries(t, s).next((i) => {
    let o = Ce();
    return n.forEach((a, u) => {
      const c = i.get(a);
      u.isFoundDocument() !== c.isFoundDocument() && (r = r.add(a)), // Note: The order of the steps below is important, since we want
      // to ensure that rejected limbo resolutions (which fabricate
      // NoDocuments with SnapshotVersion.min()) never add documents to
      // cache.
      u.isNoDocument() && u.version.isEqual(b.min()) ? (
        // NoDocuments with SnapshotVersion.min() are used in manufactured
        // events. We remove these documents from cache since we lost
        // access.
        (e.removeEntry(a, u.readTime), o = o.insert(a, u))
      ) : !c.isValidDocument() || u.version.compareTo(c.version) > 0 || u.version.compareTo(c.version) === 0 && c.hasPendingWrites ? (e.addEntry(u), o = o.insert(a, u)) : y("LocalStore", "Ignoring outdated watch update for ", a, ". Current version:", c.version, " Watch version:", u.version);
    }), {
      Wi: o,
      zi: r
    };
  });
}
function td(t, e) {
  const n = A(t);
  return n.persistence.runTransaction("Allocate target", "readwrite", (s) => {
    let r;
    return n.Cs.getTargetData(s, e).next((i) => i ? (
      // This target has been listened to previously, so reuse the
      // previous targetID.
      // TODO(mcg): freshen last accessed date?
      (r = i, d.resolve(r))
    ) : n.Cs.allocateTargetId(s).next((o) => (r = new Le(e, o, 0, s.currentSequenceNumber), n.Cs.addTargetData(s, r).next(() => r))));
  }).then((s) => {
    const r = n.qi.get(s.targetId);
    return (r === null || s.snapshotVersion.compareTo(r.snapshotVersion) > 0) && (n.qi = n.qi.insert(s.targetId, s), n.Ui.set(e, s.targetId)), s;
  });
}
async function Ls(t, e, n) {
  const s = A(t), r = s.qi.get(e), i = n ? "readwrite" : "readwrite-primary";
  try {
    n || await s.persistence.runTransaction("Release target", i, (o) => s.persistence.referenceDelegate.removeTarget(o, r));
  } catch (o) {
    if (!Bt(o)) throw o;
    y("LocalStore", `Failed to update sequence numbers for target ${e}: ${o}`);
  }
  s.qi = s.qi.remove(e), s.Ui.delete(r.target);
}
function fi(t, e, n) {
  const s = A(t);
  let r = b.min(), i = _();
  return s.persistence.runTransaction("Execute query", "readonly", (o) => function(a, u, c) {
    const h = A(a), l = h.Ui.get(c);
    return l !== void 0 ? d.resolve(h.qi.get(l)) : h.Cs.getTargetData(u, c);
  }(s, o, me(e)).next((a) => {
    if (a) return r = a.lastLimboFreeSnapshotVersion, s.Cs.getMatchingKeysForTargetId(o, a.targetId).next((u) => {
      i = u;
    });
  }).next(() => s.Li.getDocumentsMatchingQuery(o, e, n ? r : b.min(), n ? i : _())).next((a) => (nd(s, tl(e), a), {
    documents: a,
    Hi: i
  })));
}
function nd(t, e, n) {
  let s = t.Ki.get(e) || b.min();
  n.forEach((r, i) => {
    i.readTime.compareTo(s) > 0 && (s = i.readTime);
  }), t.Ki.set(e, s);
}
class pi {
  constructor() {
    this.activeTargetIds = fa();
  }
  er(e) {
    this.activeTargetIds = this.activeTargetIds.add(e);
  }
  nr(e) {
    this.activeTargetIds = this.activeTargetIds.delete(e);
  }
  /**
   * Converts this entry into a JSON-encoded format we can use for WebStorage.
   * Does not encode `clientId` as it is part of the key in WebStorage.
   */
  tr() {
    const e = {
      activeTargetIds: this.activeTargetIds.toArray(),
      updateTimeMs: Date.now()
    };
    return JSON.stringify(e);
  }
}
class sd {
  constructor() {
    this.Lr = new pi(), this.qr = {}, this.onlineStateHandler = null, this.sequenceNumberHandler = null;
  }
  addPendingMutation(e) {
  }
  updateMutationState(e, n, s) {
  }
  addLocalQueryTarget(e) {
    return this.Lr.er(e), this.qr[e] || "not-current";
  }
  updateQueryState(e, n, s) {
    this.qr[e] = n;
  }
  removeLocalQueryTarget(e) {
    this.Lr.nr(e);
  }
  isLocalQueryTarget(e) {
    return this.Lr.activeTargetIds.has(e);
  }
  clearQueryState(e) {
    delete this.qr[e];
  }
  getAllActiveQueryTargets() {
    return this.Lr.activeTargetIds;
  }
  isActiveQueryTarget(e) {
    return this.Lr.activeTargetIds.has(e);
  }
  start() {
    return this.Lr = new pi(), Promise.resolve();
  }
  handleUserChange(e, n, s) {
  }
  setOnlineState(e) {
  }
  shutdown() {
  }
  writeSequenceNumber(e) {
  }
  notifyBundleLoaded(e) {
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class rd {
  Ur(e) {
  }
  shutdown() {
  }
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class gi {
  constructor() {
    this.Kr = () => this.Gr(), this.Qr = () => this.jr(), this.Wr = [], this.zr();
  }
  Ur(e) {
    this.Wr.push(e);
  }
  shutdown() {
    window.removeEventListener("online", this.Kr), window.removeEventListener("offline", this.Qr);
  }
  zr() {
    window.addEventListener("online", this.Kr), window.addEventListener("offline", this.Qr);
  }
  Gr() {
    y("ConnectivityMonitor", "Network connectivity changed: AVAILABLE");
    for (const e of this.Wr) e(
      0
      /* NetworkStatus.AVAILABLE */
    );
  }
  jr() {
    y("ConnectivityMonitor", "Network connectivity changed: UNAVAILABLE");
    for (const e of this.Wr) e(
      1
      /* NetworkStatus.UNAVAILABLE */
    );
  }
  // TODO(chenbrian): Consider passing in window either into this component or
  // here for testing via FakeWindow.
  /** Checks that all used attributes of window are available. */
  static C() {
    return typeof window < "u" && window.addEventListener !== void 0 && window.removeEventListener !== void 0;
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const id = {
  BatchGetDocuments: "batchGet",
  Commit: "commit",
  RunQuery: "runQuery",
  RunAggregationQuery: "runAggregationQuery"
};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class od {
  constructor(e) {
    this.Hr = e.Hr, this.Jr = e.Jr;
  }
  Yr(e) {
    this.Xr = e;
  }
  Zr(e) {
    this.eo = e;
  }
  onMessage(e) {
    this.no = e;
  }
  close() {
    this.Jr();
  }
  send(e) {
    this.Hr(e);
  }
  so() {
    this.Xr();
  }
  io(e) {
    this.eo(e);
  }
  ro(e) {
    this.no(e);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ad extends /**
 * Base class for all Rest-based connections to the backend (WebChannel and
 * HTTP).
 */
class {
  constructor(e) {
    this.databaseInfo = e, this.databaseId = e.databaseId;
    const n = e.ssl ? "https" : "http";
    this.oo = n + "://" + e.host, this.uo = "projects/" + this.databaseId.projectId + "/databases/" + this.databaseId.database + "/documents";
  }
  get co() {
    return !1;
  }
  ao(e, n, s, r, i) {
    const o = this.ho(e, n);
    y("RestConnection", "Sending: ", o, s);
    const a = {};
    return this.lo(a, r, i), this.fo(e, o, a, s).then((u) => (y("RestConnection", "Received: ", u), u), (u) => {
      throw Ss("RestConnection", `${e} failed with error: `, u, "url: ", o, "request:", s), u;
    });
  }
  _o(e, n, s, r, i, o) {
    return this.ao(e, n, s, r, i);
  }
  /**
   * Modifies the headers for a request, adding any authorization token if
   * present and any additional headers for the request.
   */
  lo(e, n, s) {
    e["X-Goog-Api-Client"] = "gl-js/ fire/" + it, // Content-Type: text/plain will avoid preflight requests which might
    // mess with CORS and redirects by proxies. If we add custom headers
    // we will need to change this code to potentially use the $httpOverwrite
    // parameter supported by ESF to avoid triggering preflight requests.
    e["Content-Type"] = "text/plain", this.databaseInfo.appId && (e["X-Firebase-GMPID"] = this.databaseInfo.appId), n && n.headers.forEach((r, i) => e[i] = r), s && s.headers.forEach((r, i) => e[i] = r);
  }
  ho(e, n) {
    const s = id[e];
    return `${this.oo}/v1/${n}:${s}`;
  }
} {
  constructor(e) {
    super(e), this.forceLongPolling = e.forceLongPolling, this.autoDetectLongPolling = e.autoDetectLongPolling, this.useFetchStreams = e.useFetchStreams;
  }
  fo(e, n, s, r) {
    return new Promise((i, o) => {
      const a = new Eh();
      a.setWithCredentials(!0), a.listenOnce(yh.COMPLETE, () => {
        try {
          switch (a.getLastErrorCode()) {
            case ts.NO_ERROR:
              const c = a.getResponseJson();
              y("Connection", "XHR received:", JSON.stringify(c)), i(c);
              break;
            case ts.TIMEOUT:
              y("Connection", 'RPC "' + e + '" timed out'), o(new w(p.DEADLINE_EXCEEDED, "Request time out"));
              break;
            case ts.HTTP_ERROR:
              const h = a.getStatus();
              if (y("Connection", 'RPC "' + e + '" failed with status:', h, "response text:", a.getResponseText()), h > 0) {
                let l = a.getResponseJson();
                Array.isArray(l) && (l = l[0]);
                const f = l == null ? void 0 : l.error;
                if (f && f.status && f.message) {
                  const g = function(T) {
                    const D = T.toLowerCase().replace(/_/g, "-");
                    return Object.values(p).indexOf(D) >= 0 ? D : p.UNKNOWN;
                  }(f.status);
                  o(new w(g, f.message));
                } else o(new w(p.UNKNOWN, "Server responded with status " + a.getStatus()));
              } else
                o(new w(p.UNAVAILABLE, "Connection failed."));
              break;
            default:
              C();
          }
        } finally {
          y("Connection", 'RPC "' + e + '" completed.');
        }
      });
      const u = JSON.stringify(r);
      a.send(n, "POST", u, s, 15);
    });
  }
  wo(e, n, s) {
    const r = [this.oo, "/", "google.firestore.v1.Firestore", "/", e, "/channel"], i = gh(), o = mh(), a = {
      // Required for backend stickiness, routing behavior is based on this
      // parameter.
      httpSessionIdParam: "gsessionid",
      initMessageHeaders: {},
      messageUrlParams: {
        // This param is used to improve routing and project isolation by the
        // backend and must be included in every request.
        database: `projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`
      },
      sendRawJson: !0,
      supportsCrossDomainXhr: !0,
      internalChannelParams: {
        // Override the default timeout (randomized between 10-20 seconds) since
        // a large write batch on a slow internet connection may take a long
        // time to send to the backend. Rather than have WebChannel impose a
        // tight timeout which could lead to infinite timeouts and retries, we
        // set it very large (5-10 minutes) and rely on the browser's builtin
        // timeouts to kick in if the request isn't working.
        forwardChannelRequestTimeoutMs: 6e5
      },
      forceLongPolling: this.forceLongPolling,
      detectBufferingProxy: this.autoDetectLongPolling
    };
    this.useFetchStreams && (a.xmlHttpFactory = new wh({})), this.lo(a.initMessageHeaders, n, s), // Sending the custom headers we just added to request.initMessageHeaders
    // (Authorization, etc.) will trigger the browser to make a CORS preflight
    // request because the XHR will no longer meet the criteria for a "simple"
    // CORS request:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests
    // Therefore to avoid the CORS preflight request (an extra network
    // roundtrip), we use the encodeInitMessageHeaders option to specify that
    // the headers should instead be encoded in the request's POST payload,
    // which is recognized by the webchannel backend.
    a.encodeInitMessageHeaders = !0;
    const u = r.join("");
    y("Connection", "Creating WebChannel: " + u, a);
    const c = i.createWebChannel(u, a);
    let h = !1, l = !1;
    const f = new od({
      Hr: (T) => {
        l ? y("Connection", "Not sending because WebChannel is closed:", T) : (h || (y("Connection", "Opening WebChannel transport."), c.open(), h = !0), y("Connection", "WebChannel sending:", T), c.send(T));
      },
      Jr: () => c.close()
    }), g = (T, D, I) => {
      T.listen(D, (ne) => {
        try {
          I(ne);
        } catch (M) {
          setTimeout(() => {
            throw M;
          }, 0);
        }
      });
    };
    return g(c, Gt.EventType.OPEN, () => {
      l || y("Connection", "WebChannel transport opened.");
    }), g(c, Gt.EventType.CLOSE, () => {
      l || (l = !0, y("Connection", "WebChannel transport closed"), f.io());
    }), g(c, Gt.EventType.ERROR, (T) => {
      l || (l = !0, Ss("Connection", "WebChannel transport errored:", T), f.io(new w(p.UNAVAILABLE, "The operation could not be completed")));
    }), g(c, Gt.EventType.MESSAGE, (T) => {
      var D;
      if (!l) {
        const I = T.data[0];
        U(!!I);
        const ne = I, M = ne.error || ((D = ne[0]) === null || D === void 0 ? void 0 : D.error);
        if (M) {
          y("Connection", "WebChannel received error:", M);
          const Z = M.status;
          let L = (
            /**
            * Maps an error Code from a GRPC status identifier like 'NOT_FOUND'.
            *
            * @returns The Code equivalent to the given status string or undefined if
            *     there is no match.
            */
            function(ct) {
              const jt = P[ct];
              if (jt !== void 0) return ha(jt);
            }(Z)
          ), de = M.message;
          L === void 0 && (L = p.INTERNAL, de = "Unknown error status: " + Z + " with message " + M.message), // Mark closed so no further events are propagated
          l = !0, f.io(new w(L, de)), c.close();
        } else y("Connection", "WebChannel received:", I), f.ro(I);
      }
    }), g(o, vh.STAT_EVENT, (T) => {
      T.stat === Gr.PROXY ? y("Connection", "Detected buffering proxy") : T.stat === Gr.NOPROXY && y("Connection", "Detected no buffering proxy");
    }), setTimeout(() => {
      f.so();
    }, 0), f;
  }
}
function rs() {
  return typeof document < "u" ? document : null;
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Ca(t) {
  return new El(
    t,
    /* useProto3Json= */
    !0
  );
}
class Sa {
  constructor(e, n, s = 1e3, r = 1.5, i = 6e4) {
    this.Hs = e, this.timerId = n, this.mo = s, this.yo = r, this.po = i, this.Io = 0, this.To = null, /** The last backoff attempt, as epoch milliseconds. */
    this.Eo = Date.now(), this.reset();
  }
  /**
   * Resets the backoff delay.
   *
   * The very next backoffAndWait() will have no delay. If it is called again
   * (i.e. due to an error), initialDelayMs (plus jitter) will be used, and
   * subsequent ones will increase according to the backoffFactor.
   */
  reset() {
    this.Io = 0;
  }
  /**
   * Resets the backoff delay to the maximum delay (e.g. for use after a
   * RESOURCE_EXHAUSTED error).
   */
  Ao() {
    this.Io = this.po;
  }
  /**
   * Returns a promise that resolves after currentDelayMs, and increases the
   * delay for any subsequent attempts. If there was a pending backoff operation
   * already, it will be canceled.
   */
  Ro(e) {
    this.cancel();
    const n = Math.floor(this.Io + this.bo()), s = Math.max(0, Date.now() - this.Eo), r = Math.max(0, n - s);
    r > 0 && y("ExponentialBackoff", `Backing off for ${r} ms (base delay: ${this.Io} ms, delay with jitter: ${n} ms, last attempt: ${s} ms ago)`), this.To = this.Hs.enqueueAfterDelay(this.timerId, r, () => (this.Eo = Date.now(), e())), // Apply backoff factor to determine next delay and ensure it is within
    // bounds.
    this.Io *= this.yo, this.Io < this.mo && (this.Io = this.mo), this.Io > this.po && (this.Io = this.po);
  }
  Po() {
    this.To !== null && (this.To.skipDelay(), this.To = null);
  }
  cancel() {
    this.To !== null && (this.To.cancel(), this.To = null);
  }
  /** Returns a random value in the range [-currentBaseMs/2, currentBaseMs/2] */
  bo() {
    return (Math.random() - 0.5) * this.Io;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ud {
  constructor(e, n, s, r, i, o, a, u) {
    this.Hs = e, this.vo = s, this.Vo = r, this.connection = i, this.authCredentialsProvider = o, this.appCheckCredentialsProvider = a, this.listener = u, this.state = 0, /**
     * A close count that's incremented every time the stream is closed; used by
     * getCloseGuardedDispatcher() to invalidate callbacks that happen after
     * close.
     */
    this.So = 0, this.Do = null, this.Co = null, this.stream = null, this.xo = new Sa(e, n);
  }
  /**
   * Returns true if start() has been called and no error has occurred. True
   * indicates the stream is open or in the process of opening (which
   * encompasses respecting backoff, getting auth tokens, and starting the
   * actual RPC). Use isOpen() to determine if the stream is open and ready for
   * outbound requests.
   */
  No() {
    return this.state === 1 || this.state === 5 || this.ko();
  }
  /**
   * Returns true if the underlying RPC is open (the onOpen() listener has been
   * called) and the stream is ready for outbound requests.
   */
  ko() {
    return this.state === 2 || this.state === 3;
  }
  /**
   * Starts the RPC. Only allowed if isStarted() returns false. The stream is
   * not immediately ready for use: onOpen() will be invoked when the RPC is
   * ready for outbound requests, at which point isOpen() will return true.
   *
   * When start returns, isStarted() will return true.
   */
  start() {
    this.state !== 4 ? this.auth() : this.Oo();
  }
  /**
   * Stops the RPC. This call is idempotent and allowed regardless of the
   * current isStarted() state.
   *
   * When stop returns, isStarted() and isOpen() will both return false.
   */
  async stop() {
    this.No() && await this.close(
      0
      /* PersistentStreamState.Initial */
    );
  }
  /**
   * After an error the stream will usually back off on the next attempt to
   * start it. If the error warrants an immediate restart of the stream, the
   * sender can use this to indicate that the receiver should not back off.
   *
   * Each error will call the onClose() listener. That function can decide to
   * inhibit backoff if required.
   */
  Mo() {
    this.state = 0, this.xo.reset();
  }
  /**
   * Marks this stream as idle. If no further actions are performed on the
   * stream for one minute, the stream will automatically close itself and
   * notify the stream's onClose() handler with Status.OK. The stream will then
   * be in a !isStarted() state, requiring the caller to start the stream again
   * before further use.
   *
   * Only streams that are in state 'Open' can be marked idle, as all other
   * states imply pending network operations.
   */
  Fo() {
    this.ko() && this.Do === null && (this.Do = this.Hs.enqueueAfterDelay(this.vo, 6e4, () => this.$o()));
  }
  /** Sends a message to the underlying stream. */
  Bo(e) {
    this.Lo(), this.stream.send(e);
  }
  /** Called by the idle timer when the stream should close due to inactivity. */
  async $o() {
    if (this.ko())
      return this.close(
        0
        /* PersistentStreamState.Initial */
      );
  }
  /** Marks the stream as active again. */
  Lo() {
    this.Do && (this.Do.cancel(), this.Do = null);
  }
  /** Cancels the health check delayed operation. */
  qo() {
    this.Co && (this.Co.cancel(), this.Co = null);
  }
  /**
   * Closes the stream and cleans up as necessary:
   *
   * * closes the underlying GRPC stream;
   * * calls the onClose handler with the given 'error';
   * * sets internal stream state to 'finalState';
   * * adjusts the backoff timer based on the error
   *
   * A new stream can be opened by calling start().
   *
   * @param finalState - the intended state of the stream after closing.
   * @param error - the error the connection was closed with.
   */
  async close(e, n) {
    this.Lo(), this.qo(), this.xo.cancel(), // Invalidates any stream-related callbacks (e.g. from auth or the
    // underlying stream), guaranteeing they won't execute.
    this.So++, e !== 4 ? (
      // If this is an intentional close ensure we don't delay our next connection attempt.
      this.xo.reset()
    ) : n && n.code === p.RESOURCE_EXHAUSTED ? (
      // Log the error. (Probably either 'quota exceeded' or 'max queue length reached'.)
      (ge(n.toString()), ge("Using maximum backoff delay to prevent overloading the backend."), this.xo.Ao())
    ) : n && n.code === p.UNAUTHENTICATED && this.state !== 3 && // "unauthenticated" error means the token was rejected. This should rarely
    // happen since both Auth and AppCheck ensure a sufficient TTL when we
    // request a token. If a user manually resets their system clock this can
    // fail, however. In this case, we should get a Code.UNAUTHENTICATED error
    // before we received the first message and we need to invalidate the token
    // to ensure that we fetch a new token.
    (this.authCredentialsProvider.invalidateToken(), this.appCheckCredentialsProvider.invalidateToken()), // Clean up the underlying stream because we are no longer interested in events.
    this.stream !== null && (this.Uo(), this.stream.close(), this.stream = null), // This state must be assigned before calling onClose() to allow the callback to
    // inhibit backoff or otherwise manipulate the state in its non-started state.
    this.state = e, // Notify the listener that the stream closed.
    await this.listener.Zr(n);
  }
  /**
   * Can be overridden to perform additional cleanup before the stream is closed.
   * Calling super.tearDown() is not required.
   */
  Uo() {
  }
  auth() {
    this.state = 1;
    const e = this.Ko(this.So), n = this.So;
    Promise.all([this.authCredentialsProvider.getToken(), this.appCheckCredentialsProvider.getToken()]).then(([s, r]) => {
      this.So === n && // Normally we'd have to schedule the callback on the AsyncQueue.
      // However, the following calls are safe to be called outside the
      // AsyncQueue since they don't chain asynchronous calls
      this.Go(s, r);
    }, (s) => {
      e(() => {
        const r = new w(p.UNKNOWN, "Fetching auth token failed: " + s.message);
        return this.Qo(r);
      });
    });
  }
  Go(e, n) {
    const s = this.Ko(this.So);
    this.stream = this.jo(e, n), this.stream.Yr(() => {
      s(() => (this.state = 2, this.Co = this.Hs.enqueueAfterDelay(this.Vo, 1e4, () => (this.ko() && (this.state = 3), Promise.resolve())), this.listener.Yr()));
    }), this.stream.Zr((r) => {
      s(() => this.Qo(r));
    }), this.stream.onMessage((r) => {
      s(() => this.onMessage(r));
    });
  }
  Oo() {
    this.state = 5, this.xo.Ro(async () => {
      this.state = 0, this.start();
    });
  }
  // Visible for tests
  Qo(e) {
    return y("PersistentStream", `close with error: ${e}`), this.stream = null, this.close(4, e);
  }
  /**
   * Returns a "dispatcher" function that dispatches operations onto the
   * AsyncQueue but only runs them if closeCount remains unchanged. This allows
   * us to turn auth / stream callbacks into no-ops if the stream is closed /
   * re-opened, etc.
   */
  Ko(e) {
    return (n) => {
      this.Hs.enqueueAndForget(() => this.So === e ? n() : (y("PersistentStream", "stream callback skipped by getCloseGuardedDispatcher."), Promise.resolve()));
    };
  }
}
class cd extends ud {
  constructor(e, n, s, r, i, o) {
    super(e, "listen_stream_connection_backoff", "listen_stream_idle", "health_check_timeout", n, s, r, o), this.yt = i;
  }
  jo(e, n) {
    return this.connection.wo("Listen", e, n);
  }
  onMessage(e) {
    this.xo.reset();
    const n = Il(this.yt, e), s = function(r) {
      if (!("targetChange" in r)) return b.min();
      const i = r.targetChange;
      return i.targetIds && i.targetIds.length ? b.min() : i.readTime ? ze(i.readTime) : b.min();
    }(e);
    return this.listener.Wo(n, s);
  }
  /**
   * Registers interest in the results of the given target. If the target
   * includes a resumeToken it will be included in the request. Results that
   * affect the target will be streamed back as WatchChange messages that
   * reference the targetId.
   */
  zo(e) {
    const n = {};
    n.database = di(this.yt), n.addTarget = function(r, i) {
      let o;
      const a = i.target;
      return o = Ds(a) ? {
        documents: _l(r, a)
      } : {
        query: Al(r, a)
      }, o.targetId = i.targetId, i.resumeToken.approximateByteSize() > 0 ? o.resumeToken = bl(r, i.resumeToken) : i.snapshotVersion.compareTo(b.min()) > 0 && // TODO(wuandy): Consider removing above check because it is most likely true.
      // Right now, many tests depend on this behaviour though (leaving min() out
      // of serialization).
      (o.readTime = Tl(r, i.snapshotVersion.toTimestamp())), o;
    }(this.yt, e);
    const s = kl(this.yt, e);
    s && (n.labels = s), this.Bo(n);
  }
  /**
   * Unregisters interest in the results of the target associated with the
   * given targetId.
   */
  Ho(e) {
    const n = {};
    n.database = di(this.yt), n.removeTarget = e, this.Bo(n);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class hd extends class {
} {
  constructor(e, n, s, r) {
    super(), this.authCredentials = e, this.appCheckCredentials = n, this.connection = s, this.yt = r, this.nu = !1;
  }
  su() {
    if (this.nu) throw new w(p.FAILED_PRECONDITION, "The client has already been terminated.");
  }
  /** Invokes the provided RPC with auth and AppCheck tokens. */
  ao(e, n, s) {
    return this.su(), Promise.all([this.authCredentials.getToken(), this.appCheckCredentials.getToken()]).then(([r, i]) => this.connection.ao(e, n, s, r, i)).catch((r) => {
      throw r.name === "FirebaseError" ? (r.code === p.UNAUTHENTICATED && (this.authCredentials.invalidateToken(), this.appCheckCredentials.invalidateToken()), r) : new w(p.UNKNOWN, r.toString());
    });
  }
  /** Invokes the provided RPC with streamed results with auth and AppCheck tokens. */
  _o(e, n, s, r) {
    return this.su(), Promise.all([this.authCredentials.getToken(), this.appCheckCredentials.getToken()]).then(([i, o]) => this.connection._o(e, n, s, i, o, r)).catch((i) => {
      throw i.name === "FirebaseError" ? (i.code === p.UNAUTHENTICATED && (this.authCredentials.invalidateToken(), this.appCheckCredentials.invalidateToken()), i) : new w(p.UNKNOWN, i.toString());
    });
  }
  terminate() {
    this.nu = !0;
  }
}
class ld {
  constructor(e, n) {
    this.asyncQueue = e, this.onlineStateHandler = n, /** The current OnlineState. */
    this.state = "Unknown", /**
     * A count of consecutive failures to open the stream. If it reaches the
     * maximum defined by MAX_WATCH_STREAM_FAILURES, we'll set the OnlineState to
     * Offline.
     */
    this.iu = 0, /**
     * A timer that elapses after ONLINE_STATE_TIMEOUT_MS, at which point we
     * transition from OnlineState.Unknown to OnlineState.Offline without waiting
     * for the stream to actually fail (MAX_WATCH_STREAM_FAILURES times).
     */
    this.ru = null, /**
     * Whether the client should log a warning message if it fails to connect to
     * the backend (initially true, cleared after a successful stream, or if we've
     * logged the message already).
     */
    this.ou = !0;
  }
  /**
   * Called by RemoteStore when a watch stream is started (including on each
   * backoff attempt).
   *
   * If this is the first attempt, it sets the OnlineState to Unknown and starts
   * the onlineStateTimer.
   */
  uu() {
    this.iu === 0 && (this.cu(
      "Unknown"
      /* OnlineState.Unknown */
    ), this.ru = this.asyncQueue.enqueueAfterDelay("online_state_timeout", 1e4, () => (this.ru = null, this.au("Backend didn't respond within 10 seconds."), this.cu(
      "Offline"
      /* OnlineState.Offline */
    ), Promise.resolve())));
  }
  /**
   * Updates our OnlineState as appropriate after the watch stream reports a
   * failure. The first failure moves us to the 'Unknown' state. We then may
   * allow multiple failures (based on MAX_WATCH_STREAM_FAILURES) before we
   * actually transition to the 'Offline' state.
   */
  hu(e) {
    this.state === "Online" ? this.cu(
      "Unknown"
      /* OnlineState.Unknown */
    ) : (this.iu++, this.iu >= 1 && (this.lu(), this.au(`Connection failed 1 times. Most recent error: ${e.toString()}`), this.cu(
      "Offline"
      /* OnlineState.Offline */
    )));
  }
  /**
   * Explicitly sets the OnlineState to the specified state.
   *
   * Note that this resets our timers / failure counters, etc. used by our
   * Offline heuristics, so must not be used in place of
   * handleWatchStreamStart() and handleWatchStreamFailure().
   */
  set(e) {
    this.lu(), this.iu = 0, e === "Online" && // We've connected to watch at least once. Don't warn the developer
    // about being offline going forward.
    (this.ou = !1), this.cu(e);
  }
  cu(e) {
    e !== this.state && (this.state = e, this.onlineStateHandler(e));
  }
  au(e) {
    const n = `Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;
    this.ou ? (ge(n), this.ou = !1) : y("OnlineStateTracker", n);
  }
  lu() {
    this.ru !== null && (this.ru.cancel(), this.ru = null);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class dd {
  constructor(e, n, s, r, i) {
    this.localStore = e, this.datastore = n, this.asyncQueue = s, this.remoteSyncer = {}, /**
     * A list of up to MAX_PENDING_WRITES writes that we have fetched from the
     * LocalStore via fillWritePipeline() and have or will send to the write
     * stream.
     *
     * Whenever writePipeline.length > 0 the RemoteStore will attempt to start or
     * restart the write stream. When the stream is established the writes in the
     * pipeline will be sent in order.
     *
     * Writes remain in writePipeline until they are acknowledged by the backend
     * and thus will automatically be re-sent if the stream is interrupted /
     * restarted before they're acknowledged.
     *
     * Write responses from the backend are linked to their originating request
     * purely based on order, and so we can just shift() writes from the front of
     * the writePipeline as we receive responses.
     */
    this.fu = [], /**
     * A mapping of watched targets that the client cares about tracking and the
     * user has explicitly called a 'listen' for this target.
     *
     * These targets may or may not have been sent to or acknowledged by the
     * server. On re-establishing the listen stream, these targets should be sent
     * to the server. The targets removed with unlistens are removed eagerly
     * without waiting for confirmation from the listen stream.
     */
    this.du = /* @__PURE__ */ new Map(), /**
     * A set of reasons for why the RemoteStore may be offline. If empty, the
     * RemoteStore may start its network connections.
     */
    this._u = /* @__PURE__ */ new Set(), /**
     * Event handlers that get called when the network is disabled or enabled.
     *
     * PORTING NOTE: These functions are used on the Web client to create the
     * underlying streams (to support tree-shakeable streams). On Android and iOS,
     * the streams are created during construction of RemoteStore.
     */
    this.wu = [], this.mu = i, this.mu.Ur((o) => {
      s.enqueueAndForget(async () => {
        qt(this) && (y("RemoteStore", "Restarting streams for network reachability change."), await async function(a) {
          const u = A(a);
          u._u.add(
            4
            /* OfflineCause.ConnectivityChange */
          ), await $t(u), u.gu.set(
            "Unknown"
            /* OnlineState.Unknown */
          ), u._u.delete(
            4
            /* OfflineCause.ConnectivityChange */
          ), await qn(u);
        }(this));
      });
    }), this.gu = new ld(s, r);
  }
}
async function qn(t) {
  if (qt(t)) for (const e of t.wu) await e(
    /* enabled= */
    !0
  );
}
async function $t(t) {
  for (const e of t.wu) await e(
    /* enabled= */
    !1
  );
}
function Ia(t, e) {
  const n = A(t);
  n.du.has(e.targetId) || // Mark this as something the client is currently listening for.
  (n.du.set(e.targetId, e), wr(n) ? (
    // The listen will be sent in onWatchStreamOpen
    vr(n)
  ) : at(n).ko() && yr(n, e));
}
function _a(t, e) {
  const n = A(t), s = at(n);
  n.du.delete(e), s.ko() && Aa(n, e), n.du.size === 0 && (s.ko() ? s.Fo() : qt(n) && // Revert to OnlineState.Unknown if the watch stream is not open and we
  // have no listeners, since without any listens to send we cannot
  // confirm if the stream is healthy and upgrade to OnlineState.Online.
  n.gu.set(
    "Unknown"
    /* OnlineState.Unknown */
  ));
}
function yr(t, e) {
  t.yu.Ot(e.targetId), at(t).zo(e);
}
function Aa(t, e) {
  t.yu.Ot(e), at(t).Ho(e);
}
function vr(t) {
  t.yu = new ml({
    getRemoteKeysForTarget: (e) => t.remoteSyncer.getRemoteKeysForTarget(e),
    ne: (e) => t.du.get(e) || null
  }), at(t).start(), t.gu.uu();
}
function wr(t) {
  return qt(t) && !at(t).No() && t.du.size > 0;
}
function qt(t) {
  return A(t)._u.size === 0;
}
function Da(t) {
  t.yu = void 0;
}
async function fd(t) {
  t.du.forEach((e, n) => {
    yr(t, e);
  });
}
async function pd(t, e) {
  Da(t), // If we still need the watch stream, retry the connection.
  wr(t) ? (t.gu.hu(e), vr(t)) : (
    // No need to restart watch stream because there are no active targets.
    // The online state is set to unknown because there is no active attempt
    // at establishing a connection
    t.gu.set(
      "Unknown"
      /* OnlineState.Unknown */
    )
  );
}
async function gd(t, e, n) {
  if (
    // Mark the client as online since we got a message from the server
    t.gu.set(
      "Online"
      /* OnlineState.Online */
    ), e instanceof ga && e.state === 2 && e.cause
  )
    try {
      await /** Handles an error on a target */
      async function(s, r) {
        const i = r.cause;
        for (const o of r.targetIds)
          s.du.has(o) && (await s.remoteSyncer.rejectListen(o, i), s.du.delete(o), s.yu.removeTarget(o));
      }(t, e);
    } catch (s) {
      y("RemoteStore", "Failed to remove targets %s: %s ", e.targetIds.join(","), s), await mi(t, s);
    }
  else if (e instanceof en ? t.yu.Kt(e) : e instanceof pa ? t.yu.Jt(e) : t.yu.jt(e), !n.isEqual(b.min())) try {
    const s = await ba(t.localStore);
    n.compareTo(s) >= 0 && // We have received a target change with a global snapshot if the snapshot
    // version is not equal to SnapshotVersion.min().
    await /**
    * Takes a batch of changes from the Datastore, repackages them as a
    * RemoteEvent, and passes that on to the listener, which is typically the
    * SyncEngine.
    */
    function(r, i) {
      const o = r.yu.Zt(i);
      return o.targetChanges.forEach((a, u) => {
        if (a.resumeToken.approximateByteSize() > 0) {
          const c = r.du.get(u);
          c && r.du.set(u, c.withResumeToken(a.resumeToken, i));
        }
      }), // Re-establish listens for the targets that have been invalidated by
      // existence filter mismatches.
      o.targetMismatches.forEach((a) => {
        const u = r.du.get(a);
        if (!u)
          return;
        r.du.set(a, u.withResumeToken(J.EMPTY_BYTE_STRING, u.snapshotVersion)), // Cause a hard reset by unwatching and rewatching immediately, but
        // deliberately don't send a resume token so that we get a full update.
        Aa(r, a);
        const c = new Le(u.target, a, 1, u.sequenceNumber);
        yr(r, c);
      }), r.remoteSyncer.applyRemoteEvent(o);
    }(t, n);
  } catch (s) {
    y("RemoteStore", "Failed to raise snapshot:", s), await mi(t, s);
  }
}
async function mi(t, e, n) {
  if (!Bt(e)) throw e;
  t._u.add(
    1
    /* OfflineCause.IndexedDbFailed */
  ), // Disable network and raise offline snapshots
  await $t(t), t.gu.set(
    "Offline"
    /* OnlineState.Offline */
  ), n || // Use a simple read operation to determine if IndexedDB recovered.
  // Ideally, we would expose a health check directly on SimpleDb, but
  // RemoteStore only has access to persistence through LocalStore.
  (n = () => ba(t.localStore)), // Probe IndexedDB periodically and re-enable network
  t.asyncQueue.enqueueRetryable(async () => {
    y("RemoteStore", "Retrying IndexedDB access"), await n(), t._u.delete(
      1
      /* OfflineCause.IndexedDbFailed */
    ), await qn(t);
  });
}
async function yi(t, e) {
  const n = A(t);
  n.asyncQueue.verifyOperationInProgress(), y("RemoteStore", "RemoteStore received new credentials");
  const s = qt(n);
  n._u.add(
    3
    /* OfflineCause.CredentialChange */
  ), await $t(n), s && // Don't set the network status to Unknown if we are offline.
  n.gu.set(
    "Unknown"
    /* OnlineState.Unknown */
  ), await n.remoteSyncer.handleCredentialChange(e), n._u.delete(
    3
    /* OfflineCause.CredentialChange */
  ), await qn(n);
}
async function md(t, e) {
  const n = A(t);
  e ? (n._u.delete(
    2
    /* OfflineCause.IsSecondary */
  ), await qn(n)) : e || (n._u.add(
    2
    /* OfflineCause.IsSecondary */
  ), await $t(n), n.gu.set(
    "Unknown"
    /* OnlineState.Unknown */
  ));
}
function at(t) {
  return t.pu || // Create stream (but note that it is not started yet).
  (t.pu = function(e, n, s) {
    const r = A(e);
    return r.su(), new cd(n, r.connection, r.authCredentials, r.appCheckCredentials, r.yt, s);
  }(t.datastore, t.asyncQueue, {
    Yr: fd.bind(null, t),
    Zr: pd.bind(null, t),
    Wo: gd.bind(null, t)
  }), t.wu.push(async (e) => {
    e ? (t.pu.Mo(), wr(t) ? vr(t) : t.gu.set(
      "Unknown"
      /* OnlineState.Unknown */
    )) : (await t.pu.stop(), Da(t));
  })), t.pu;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Er {
  constructor(e, n, s, r, i) {
    this.asyncQueue = e, this.timerId = n, this.targetTimeMs = s, this.op = r, this.removalCallback = i, this.deferred = new Ne(), this.then = this.deferred.promise.then.bind(this.deferred.promise), // It's normal for the deferred promise to be canceled (due to cancellation)
    // and so we attach a dummy catch callback to avoid
    // 'UnhandledPromiseRejectionWarning' log spam.
    this.deferred.promise.catch((o) => {
    });
  }
  /**
   * Creates and returns a DelayedOperation that has been scheduled to be
   * executed on the provided asyncQueue after the provided delayMs.
   *
   * @param asyncQueue - The queue to schedule the operation on.
   * @param id - A Timer ID identifying the type of operation this is.
   * @param delayMs - The delay (ms) before the operation should be scheduled.
   * @param op - The operation to run.
   * @param removalCallback - A callback to be called synchronously once the
   *   operation is executed or canceled, notifying the AsyncQueue to remove it
   *   from its delayedOperations list.
   *   PORTING NOTE: This exists to prevent making removeDelayedOperation() and
   *   the DelayedOperation class public.
   */
  static createAndSchedule(e, n, s, r, i) {
    const o = Date.now() + s, a = new Er(e, n, o, r, i);
    return a.start(s), a;
  }
  /**
   * Starts the timer. This is called immediately after construction by
   * createAndSchedule().
   */
  start(e) {
    this.timerHandle = setTimeout(() => this.handleDelayElapsed(), e);
  }
  /**
   * Queues the operation to run immediately (if it hasn't already been run or
   * canceled).
   */
  skipDelay() {
    return this.handleDelayElapsed();
  }
  /**
   * Cancels the operation if it hasn't already been executed or canceled. The
   * promise will be rejected.
   *
   * As long as the operation has not yet been run, calling cancel() provides a
   * guarantee that the operation will not be run.
   */
  cancel(e) {
    this.timerHandle !== null && (this.clearTimeout(), this.deferred.reject(new w(p.CANCELLED, "Operation cancelled" + (e ? ": " + e : ""))));
  }
  handleDelayElapsed() {
    this.asyncQueue.enqueueAndForget(() => this.timerHandle !== null ? (this.clearTimeout(), this.op().then((e) => this.deferred.resolve(e))) : Promise.resolve());
  }
  clearTimeout() {
    this.timerHandle !== null && (this.removalCallback(this), clearTimeout(this.timerHandle), this.timerHandle = null);
  }
}
function ka(t, e) {
  if (ge("AsyncQueue", `${e}: ${t}`), Bt(t)) return new w(p.UNAVAILABLE, `${e}: ${t}`);
  throw t;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ge {
  /** The default ordering is by key if the comparator is omitted */
  constructor(e) {
    this.comparator = e ? (n, s) => e(n, s) || v.comparator(n.key, s.key) : (n, s) => v.comparator(n.key, s.key), this.keyedMap = pt(), this.sortedSet = new z(this.comparator);
  }
  /**
   * Returns an empty copy of the existing DocumentSet, using the same
   * comparator.
   */
  static emptySet(e) {
    return new Ge(e.comparator);
  }
  has(e) {
    return this.keyedMap.get(e) != null;
  }
  get(e) {
    return this.keyedMap.get(e);
  }
  first() {
    return this.sortedSet.minKey();
  }
  last() {
    return this.sortedSet.maxKey();
  }
  isEmpty() {
    return this.sortedSet.isEmpty();
  }
  /**
   * Returns the index of the provided key in the document set, or -1 if the
   * document key is not present in the set;
   */
  indexOf(e) {
    const n = this.keyedMap.get(e);
    return n ? this.sortedSet.indexOf(n) : -1;
  }
  get size() {
    return this.sortedSet.size;
  }
  /** Iterates documents in order defined by "comparator" */
  forEach(e) {
    this.sortedSet.inorderTraversal((n, s) => (e(n), !1));
  }
  /** Inserts or updates a document with the same key */
  add(e) {
    const n = this.delete(e.key);
    return n.copy(n.keyedMap.insert(e.key, e), n.sortedSet.insert(e, null));
  }
  /** Deletes a document with a given key */
  delete(e) {
    const n = this.get(e);
    return n ? this.copy(this.keyedMap.remove(e), this.sortedSet.remove(n)) : this;
  }
  isEqual(e) {
    if (!(e instanceof Ge) || this.size !== e.size) return !1;
    const n = this.sortedSet.getIterator(), s = e.sortedSet.getIterator();
    for (; n.hasNext(); ) {
      const r = n.getNext().key, i = s.getNext().key;
      if (!r.isEqual(i)) return !1;
    }
    return !0;
  }
  toString() {
    const e = [];
    return this.forEach((n) => {
      e.push(n.toString());
    }), e.length === 0 ? "DocumentSet ()" : `DocumentSet (
  ` + e.join(`  
`) + `
)`;
  }
  copy(e, n) {
    const s = new Ge();
    return s.comparator = this.comparator, s.keyedMap = e, s.sortedSet = n, s;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class vi {
  constructor() {
    this.Tu = new z(v.comparator);
  }
  track(e) {
    const n = e.doc.key, s = this.Tu.get(n);
    s ? (
      // Merge the new change with the existing change.
      e.type !== 0 && s.type === 3 ? this.Tu = this.Tu.insert(n, e) : e.type === 3 && s.type !== 1 ? this.Tu = this.Tu.insert(n, {
        type: s.type,
        doc: e.doc
      }) : e.type === 2 && s.type === 2 ? this.Tu = this.Tu.insert(n, {
        type: 2,
        doc: e.doc
      }) : e.type === 2 && s.type === 0 ? this.Tu = this.Tu.insert(n, {
        type: 0,
        doc: e.doc
      }) : e.type === 1 && s.type === 0 ? this.Tu = this.Tu.remove(n) : e.type === 1 && s.type === 2 ? this.Tu = this.Tu.insert(n, {
        type: 1,
        doc: s.doc
      }) : e.type === 0 && s.type === 1 ? this.Tu = this.Tu.insert(n, {
        type: 2,
        doc: e.doc
      }) : (
        // This includes these cases, which don't make sense:
        // Added->Added
        // Removed->Removed
        // Modified->Added
        // Removed->Modified
        // Metadata->Added
        // Removed->Metadata
        C()
      )
    ) : this.Tu = this.Tu.insert(n, e);
  }
  Eu() {
    const e = [];
    return this.Tu.inorderTraversal((n, s) => {
      e.push(s);
    }), e;
  }
}
class nt {
  constructor(e, n, s, r, i, o, a, u, c) {
    this.query = e, this.docs = n, this.oldDocs = s, this.docChanges = r, this.mutatedKeys = i, this.fromCache = o, this.syncStateChanged = a, this.excludesMetadataChanges = u, this.hasCachedResults = c;
  }
  /** Returns a view snapshot as if all documents in the snapshot were added. */
  static fromInitialDocuments(e, n, s, r, i) {
    const o = [];
    return n.forEach((a) => {
      o.push({
        type: 0,
        doc: a
      });
    }), new nt(
      e,
      n,
      Ge.emptySet(n),
      o,
      s,
      r,
      /* syncStateChanged= */
      !0,
      /* excludesMetadataChanges= */
      !1,
      i
    );
  }
  get hasPendingWrites() {
    return !this.mutatedKeys.isEmpty();
  }
  isEqual(e) {
    if (!(this.fromCache === e.fromCache && this.hasCachedResults === e.hasCachedResults && this.syncStateChanged === e.syncStateChanged && this.mutatedKeys.isEqual(e.mutatedKeys) && Un(this.query, e.query) && this.docs.isEqual(e.docs) && this.oldDocs.isEqual(e.oldDocs))) return !1;
    const n = this.docChanges, s = e.docChanges;
    if (n.length !== s.length) return !1;
    for (let r = 0; r < n.length; r++) if (n[r].type !== s[r].type || !n[r].doc.isEqual(s[r].doc)) return !1;
    return !0;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class yd {
  constructor() {
    this.Au = void 0, this.listeners = [];
  }
}
class vd {
  constructor() {
    this.queries = new ot((e) => sa(e), Un), this.onlineState = "Unknown", this.Ru = /* @__PURE__ */ new Set();
  }
}
async function wd(t, e) {
  const n = A(t), s = e.query;
  let r = !1, i = n.queries.get(s);
  if (i || (r = !0, i = new yd()), r) try {
    i.Au = await n.onListen(s);
  } catch (o) {
    const a = ka(o, `Initialization of query '${Rs(e.query)}' failed`);
    return void e.onError(a);
  }
  n.queries.set(s, i), i.listeners.push(e), // Run global snapshot listeners if a consistent snapshot has been emitted.
  e.bu(n.onlineState), i.Au && e.Pu(i.Au) && Tr(n);
}
async function Ed(t, e) {
  const n = A(t), s = e.query;
  let r = !1;
  const i = n.queries.get(s);
  if (i) {
    const o = i.listeners.indexOf(e);
    o >= 0 && (i.listeners.splice(o, 1), r = i.listeners.length === 0);
  }
  if (r) return n.queries.delete(s), n.onUnlisten(s);
}
function Td(t, e) {
  const n = A(t);
  let s = !1;
  for (const r of e) {
    const i = r.query, o = n.queries.get(i);
    if (o) {
      for (const a of o.listeners) a.Pu(r) && (s = !0);
      o.Au = r;
    }
  }
  s && Tr(n);
}
function bd(t, e, n) {
  const s = A(t), r = s.queries.get(e);
  if (r) for (const i of r.listeners) i.onError(n);
  s.queries.delete(e);
}
function Tr(t) {
  t.Ru.forEach((e) => {
    e.next();
  });
}
class Cd {
  constructor(e, n, s) {
    this.query = e, this.vu = n, /**
     * Initial snapshots (e.g. from cache) may not be propagated to the wrapped
     * observer. This flag is set to true once we've actually raised an event.
     */
    this.Vu = !1, this.Su = null, this.onlineState = "Unknown", this.options = s || {};
  }
  /**
   * Applies the new ViewSnapshot to this listener, raising a user-facing event
   * if applicable (depending on what changed, whether the user has opted into
   * metadata-only changes, etc.). Returns true if a user-facing event was
   * indeed raised.
   */
  Pu(e) {
    if (!this.options.includeMetadataChanges) {
      const s = [];
      for (const r of e.docChanges) r.type !== 3 && s.push(r);
      e = new nt(
        e.query,
        e.docs,
        e.oldDocs,
        s,
        e.mutatedKeys,
        e.fromCache,
        e.syncStateChanged,
        /* excludesMetadataChanges= */
        !0,
        e.hasCachedResults
      );
    }
    let n = !1;
    return this.Vu ? this.Du(e) && (this.vu.next(e), n = !0) : this.Cu(e, this.onlineState) && (this.xu(e), n = !0), this.Su = e, n;
  }
  onError(e) {
    this.vu.error(e);
  }
  /** Returns whether a snapshot was raised. */
  bu(e) {
    this.onlineState = e;
    let n = !1;
    return this.Su && !this.Vu && this.Cu(this.Su, e) && (this.xu(this.Su), n = !0), n;
  }
  Cu(e, n) {
    if (!e.fromCache) return !0;
    const s = n !== "Offline";
    return (!this.options.Nu || !s) && (!e.docs.isEmpty() || e.hasCachedResults || n === "Offline");
  }
  Du(e) {
    if (e.docChanges.length > 0) return !0;
    const n = this.Su && this.Su.hasPendingWrites !== e.hasPendingWrites;
    return !(!e.syncStateChanged && !n) && this.options.includeMetadataChanges === !0;
  }
  xu(e) {
    e = nt.fromInitialDocuments(e.query, e.docs, e.mutatedKeys, e.fromCache, e.hasCachedResults), this.Vu = !0, this.vu.next(e);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ra {
  constructor(e) {
    this.key = e;
  }
}
class Na {
  constructor(e) {
    this.key = e;
  }
}
class Sd {
  constructor(e, n) {
    this.query = e, this.qu = n, this.Uu = null, this.hasCachedResults = !1, /**
     * A flag whether the view is current with the backend. A view is considered
     * current after it has seen the current flag from the backend and did not
     * lose consistency within the watch stream (e.g. because of an existence
     * filter mismatch).
     */
    this.current = !1, /** Documents in the view but not in the remote target */
    this.Ku = _(), /** Document Keys that have local changes */
    this.mutatedKeys = _(), this.Gu = ra(e), this.Qu = new Ge(this.Gu);
  }
  /**
   * The set of remote documents that the server has told us belongs to the target associated with
   * this view.
   */
  get ju() {
    return this.qu;
  }
  /**
   * Iterates over a set of doc changes, applies the query limit, and computes
   * what the new results should be, what the changes were, and whether we may
   * need to go back to the local cache for more results. Does not make any
   * changes to the view.
   * @param docChanges - The doc changes to apply to this view.
   * @param previousChanges - If this is being called with a refill, then start
   *        with this set of docs and changes instead of the current view.
   * @returns a new set of docs, changes, and refill flag.
   */
  Wu(e, n) {
    const s = n ? n.zu : new vi(), r = n ? n.Qu : this.Qu;
    let i = n ? n.mutatedKeys : this.mutatedKeys, o = r, a = !1;
    const u = this.query.limitType === "F" && r.size === this.query.limit ? r.last() : null, c = this.query.limitType === "L" && r.size === this.query.limit ? r.first() : null;
    if (e.inorderTraversal((h, l) => {
      const f = r.get(h), g = lr(this.query, l) ? l : null, T = !!f && this.mutatedKeys.has(f.key), D = !!g && (g.hasLocalMutations || // We only consider committed mutations for documents that were
      // mutated during the lifetime of the view.
      this.mutatedKeys.has(g.key) && g.hasCommittedMutations);
      let I = !1;
      f && g ? f.data.isEqual(g.data) ? T !== D && (s.track({
        type: 3,
        doc: g
      }), I = !0) : this.Hu(f, g) || (s.track({
        type: 2,
        doc: g
      }), I = !0, (u && this.Gu(g, u) > 0 || c && this.Gu(g, c) < 0) && // This doc moved from inside the limit to outside the limit.
      // That means there may be some other doc in the local cache
      // that should be included instead.
      (a = !0)) : !f && g ? (s.track({
        type: 0,
        doc: g
      }), I = !0) : f && !g && (s.track({
        type: 1,
        doc: f
      }), I = !0, (u || c) && // A doc was removed from a full limit query. We'll need to
      // requery from the local cache to see if we know about some other
      // doc that should be in the results.
      (a = !0)), I && (g ? (o = o.add(g), i = D ? i.add(h) : i.delete(h)) : (o = o.delete(h), i = i.delete(h)));
    }), this.query.limit !== null) for (; o.size > this.query.limit; ) {
      const h = this.query.limitType === "F" ? o.last() : o.first();
      o = o.delete(h.key), i = i.delete(h.key), s.track({
        type: 1,
        doc: h
      });
    }
    return {
      Qu: o,
      zu: s,
      $i: a,
      mutatedKeys: i
    };
  }
  Hu(e, n) {
    return e.hasLocalMutations && n.hasCommittedMutations && !n.hasLocalMutations;
  }
  /**
   * Updates the view with the given ViewDocumentChanges and optionally updates
   * limbo docs and sync state from the provided target change.
   * @param docChanges - The set of changes to make to the view's docs.
   * @param updateLimboDocuments - Whether to update limbo documents based on
   *        this change.
   * @param targetChange - A target change to apply for computing limbo docs and
   *        sync state.
   * @returns A new ViewChange with the given docs, changes, and sync state.
   */
  // PORTING NOTE: The iOS/Android clients always compute limbo document changes.
  applyChanges(e, n, s) {
    const r = this.Qu;
    this.Qu = e.Qu, this.mutatedKeys = e.mutatedKeys;
    const i = e.zu.Eu();
    i.sort((c, h) => function(l, f) {
      const g = (T) => {
        switch (T) {
          case 0:
            return 1;
          case 2:
          case 3:
            return 2;
          case 1:
            return 0;
          default:
            return C();
        }
      };
      return g(l) - g(f);
    }(c.type, h.type) || this.Gu(c.doc, h.doc)), this.Ju(s);
    const o = n ? this.Yu() : [], a = this.Ku.size === 0 && this.current ? 1 : 0, u = a !== this.Uu;
    return this.Uu = a, i.length !== 0 || u ? {
      snapshot: new nt(
        this.query,
        e.Qu,
        r,
        i,
        e.mutatedKeys,
        a === 0,
        u,
        /* excludesMetadataChanges= */
        !1,
        !!s && s.resumeToken.approximateByteSize() > 0
      ),
      Xu: o
    } : {
      Xu: o
    };
  }
  /**
   * Applies an OnlineState change to the view, potentially generating a
   * ViewChange if the view's syncState changes as a result.
   */
  bu(e) {
    return this.current && e === "Offline" ? (
      // If we're offline, set `current` to false and then call applyChanges()
      // to refresh our syncState and generate a ViewChange as appropriate. We
      // are guaranteed to get a new TargetChange that sets `current` back to
      // true once the client is back online.
      (this.current = !1, this.applyChanges(
        {
          Qu: this.Qu,
          zu: new vi(),
          mutatedKeys: this.mutatedKeys,
          $i: !1
        },
        /* updateLimboDocuments= */
        !1
      ))
    ) : {
      Xu: []
    };
  }
  /**
   * Returns whether the doc for the given key should be in limbo.
   */
  Zu(e) {
    return !this.qu.has(e) && // The local store doesn't think it's a result, so it shouldn't be in limbo.
    !!this.Qu.has(e) && !this.Qu.get(e).hasLocalMutations;
  }
  /**
   * Updates syncedDocuments, current, and limbo docs based on the given change.
   * Returns the list of changes to which docs are in limbo.
   */
  Ju(e) {
    e && (e.addedDocuments.forEach((n) => this.qu = this.qu.add(n)), e.modifiedDocuments.forEach((n) => {
    }), e.removedDocuments.forEach((n) => this.qu = this.qu.delete(n)), this.current = e.current);
  }
  Yu() {
    if (!this.current) return [];
    const e = this.Ku;
    this.Ku = _(), this.Qu.forEach((s) => {
      this.Zu(s.key) && (this.Ku = this.Ku.add(s.key));
    });
    const n = [];
    return e.forEach((s) => {
      this.Ku.has(s) || n.push(new Na(s));
    }), this.Ku.forEach((s) => {
      e.has(s) || n.push(new Ra(s));
    }), n;
  }
  /**
   * Update the in-memory state of the current view with the state read from
   * persistence.
   *
   * We update the query view whenever a client's primary status changes:
   * - When a client transitions from primary to secondary, it can miss
   *   LocalStorage updates and its query views may temporarily not be
   *   synchronized with the state on disk.
   * - For secondary to primary transitions, the client needs to update the list
   *   of `syncedDocuments` since secondary clients update their query views
   *   based purely on synthesized RemoteEvents.
   *
   * @param queryResult.documents - The documents that match the query according
   * to the LocalStore.
   * @param queryResult.remoteKeys - The keys of the documents that match the
   * query according to the backend.
   *
   * @returns The ViewChange that resulted from this synchronization.
   */
  // PORTING NOTE: Multi-tab only.
  tc(e) {
    this.qu = e.Hi, this.Ku = _();
    const n = this.Wu(e.documents);
    return this.applyChanges(
      n,
      /*updateLimboDocuments=*/
      !0
    );
  }
  /**
   * Returns a view snapshot as if this query was just listened to. Contains
   * a document add for every existing document and the `fromCache` and
   * `hasPendingWrites` status of the already established view.
   */
  // PORTING NOTE: Multi-tab only.
  ec() {
    return nt.fromInitialDocuments(this.query, this.Qu, this.mutatedKeys, this.Uu === 0, this.hasCachedResults);
  }
}
class Id {
  constructor(e, n, s) {
    this.query = e, this.targetId = n, this.view = s;
  }
}
class _d {
  constructor(e) {
    this.key = e, /**
     * Set to true once we've received a document. This is used in
     * getRemoteKeysForTarget() and ultimately used by WatchChangeAggregator to
     * decide whether it needs to manufacture a delete event for the target once
     * the target is CURRENT.
     */
    this.nc = !1;
  }
}
class Ad {
  constructor(e, n, s, r, i, o) {
    this.localStore = e, this.remoteStore = n, this.eventManager = s, this.sharedClientState = r, this.currentUser = i, this.maxConcurrentLimboResolutions = o, this.sc = {}, this.ic = new ot((a) => sa(a), Un), this.rc = /* @__PURE__ */ new Map(), /**
     * The keys of documents that are in limbo for which we haven't yet started a
     * limbo resolution query. The strings in this set are the result of calling
     * `key.path.canonicalString()` where `key` is a `DocumentKey` object.
     *
     * The `Set` type was chosen because it provides efficient lookup and removal
     * of arbitrary elements and it also maintains insertion order, providing the
     * desired queue-like FIFO semantics.
     */
    this.oc = /* @__PURE__ */ new Set(), /**
     * Keeps track of the target ID for each document that is in limbo with an
     * active target.
     */
    this.uc = new z(v.comparator), /**
     * Keeps track of the information about an active limbo resolution for each
     * active target ID that was started for the purpose of limbo resolution.
     */
    this.cc = /* @__PURE__ */ new Map(), this.ac = new pr(), /** Stores user completion handlers, indexed by User and BatchId. */
    this.hc = {}, /** Stores user callbacks waiting for all pending writes to be acknowledged. */
    this.lc = /* @__PURE__ */ new Map(), this.fc = tt.vn(), this.onlineState = "Unknown", // The primary state is set to `true` or `false` immediately after Firestore
    // startup. In the interim, a client should only be considered primary if
    // `isPrimary` is true.
    this.dc = void 0;
  }
  get isPrimaryClient() {
    return this.dc === !0;
  }
}
async function Dd(t, e) {
  const n = Md(t);
  let s, r;
  const i = n.ic.get(e);
  if (i)
    s = i.targetId, n.sharedClientState.addLocalQueryTarget(s), r = i.view.ec();
  else {
    const o = await td(n.localStore, me(e));
    n.isPrimaryClient && Ia(n.remoteStore, o);
    const a = n.sharedClientState.addLocalQueryTarget(o.targetId);
    s = o.targetId, r = await kd(n, e, s, a === "current", o.resumeToken);
  }
  return r;
}
async function kd(t, e, n, s, r) {
  t._c = (l, f, g) => async function(T, D, I, ne) {
    let M = D.view.Wu(I);
    M.$i && // The query has a limit and some docs were removed, so we need
    // to re-run the query against the local store to make sure we
    // didn't lose any good docs that had been past the limit.
    (M = await fi(
      T.localStore,
      D.query,
      /* usePreviousResults= */
      !1
    ).then(({ documents: de }) => D.view.Wu(de, M)));
    const Z = ne && ne.targetChanges.get(D.targetId), L = D.view.applyChanges(
      M,
      /* updateLimboDocuments= */
      T.isPrimaryClient,
      Z
    );
    return Ei(T, D.targetId, L.Xu), L.snapshot;
  }(t, l, f, g);
  const i = await fi(
    t.localStore,
    e,
    /* usePreviousResults= */
    !0
  ), o = new Sd(e, i.Hi), a = o.Wu(i.documents), u = Vt.createSynthesizedTargetChangeForCurrentChange(n, s && t.onlineState !== "Offline", r), c = o.applyChanges(
    a,
    /* updateLimboDocuments= */
    t.isPrimaryClient,
    u
  );
  Ei(t, n, c.Xu);
  const h = new Id(e, n, o);
  return t.ic.set(e, h), t.rc.has(n) ? t.rc.get(n).push(e) : t.rc.set(n, [e]), c.snapshot;
}
async function Rd(t, e) {
  const n = A(t), s = n.ic.get(e), r = n.rc.get(s.targetId);
  if (r.length > 1) return n.rc.set(s.targetId, r.filter((i) => !Un(i, e))), void n.ic.delete(e);
  n.isPrimaryClient ? (n.sharedClientState.removeLocalQueryTarget(s.targetId), n.sharedClientState.isActiveQueryTarget(s.targetId) || await Ls(
    n.localStore,
    s.targetId,
    /*keepPersistedTargetData=*/
    !1
  ).then(() => {
    n.sharedClientState.clearQueryState(s.targetId), _a(n.remoteStore, s.targetId), Ms(n, s.targetId);
  }).catch(or)) : (Ms(n, s.targetId), await Ls(
    n.localStore,
    s.targetId,
    /*keepPersistedTargetData=*/
    !0
  ));
}
async function xa(t, e) {
  const n = A(t);
  try {
    const s = await Zl(n.localStore, e);
    e.targetChanges.forEach((r, i) => {
      const o = n.cc.get(i);
      o && // Since this is a limbo resolution lookup, it's for a single document
      // and it could be added, modified, or removed, but not a combination.
      (U(r.addedDocuments.size + r.modifiedDocuments.size + r.removedDocuments.size <= 1), r.addedDocuments.size > 0 ? o.nc = !0 : r.modifiedDocuments.size > 0 ? U(o.nc) : r.removedDocuments.size > 0 && (U(o.nc), o.nc = !1));
    }), await La(n, s, e);
  } catch (s) {
    await or(s);
  }
}
function wi(t, e, n) {
  const s = A(t);
  if (s.isPrimaryClient && n === 0 || !s.isPrimaryClient && n === 1) {
    const r = [];
    s.ic.forEach((i, o) => {
      const a = o.view.bu(e);
      a.snapshot && r.push(a.snapshot);
    }), function(i, o) {
      const a = A(i);
      a.onlineState = o;
      let u = !1;
      a.queries.forEach((c, h) => {
        for (const l of h.listeners)
          l.bu(o) && (u = !0);
      }), u && Tr(a);
    }(s.eventManager, e), r.length && s.sc.Wo(r), s.onlineState = e, s.isPrimaryClient && s.sharedClientState.setOnlineState(e);
  }
}
async function Nd(t, e, n) {
  const s = A(t);
  s.sharedClientState.updateQueryState(e, "rejected", n);
  const r = s.cc.get(e), i = r && r.key;
  if (i) {
    let o = new z(v.comparator);
    o = o.insert(i, Q.newNoDocument(i, b.min()));
    const a = _().add(i), u = new $n(
      b.min(),
      /* targetChanges= */
      /* @__PURE__ */ new Map(),
      /* targetMismatches= */
      new $(R),
      o,
      a
    );
    await xa(s, u), // Since this query failed, we won't want to manually unlisten to it.
    // We only remove it from bookkeeping after we successfully applied the
    // RemoteEvent. If `applyRemoteEvent()` throws, we want to re-listen to
    // this query when the RemoteStore restarts the Watch stream, which should
    // re-trigger the target failure.
    s.uc = s.uc.remove(i), s.cc.delete(e), br(s);
  } else await Ls(
    s.localStore,
    e,
    /* keepPersistedTargetData */
    !1
  ).then(() => Ms(s, e, n)).catch(or);
}
function Ms(t, e, n = null) {
  t.sharedClientState.removeLocalQueryTarget(e);
  for (const s of t.rc.get(e)) t.ic.delete(s), n && t.sc.wc(s, n);
  t.rc.delete(e), t.isPrimaryClient && t.ac.ls(e).forEach((s) => {
    t.ac.containsKey(s) || // We removed the last reference for this key
    Oa(t, s);
  });
}
function Oa(t, e) {
  t.oc.delete(e.path.canonicalString());
  const n = t.uc.get(e);
  n !== null && (_a(t.remoteStore, n), t.uc = t.uc.remove(e), t.cc.delete(n), br(t));
}
function Ei(t, e, n) {
  for (const s of n) s instanceof Ra ? (t.ac.addReference(s.key, e), xd(t, s)) : s instanceof Na ? (y("SyncEngine", "Document no longer in limbo: " + s.key), t.ac.removeReference(s.key, e), t.ac.containsKey(s.key) || // We removed the last reference for this key
  Oa(t, s.key)) : C();
}
function xd(t, e) {
  const n = e.key, s = n.path.canonicalString();
  t.uc.get(n) || t.oc.has(s) || (y("SyncEngine", "New document in limbo: " + n), t.oc.add(s), br(t));
}
function br(t) {
  for (; t.oc.size > 0 && t.uc.size < t.maxConcurrentLimboResolutions; ) {
    const e = t.oc.values().next().value;
    t.oc.delete(e);
    const n = new v(x.fromString(e)), s = t.fc.next();
    t.cc.set(s, new _d(n)), t.uc = t.uc.insert(n, s), Ia(t.remoteStore, new Le(me(na(n.path)), s, 2, ar.at));
  }
}
async function La(t, e, n) {
  const s = A(t), r = [], i = [], o = [];
  s.ic.isEmpty() || (s.ic.forEach((a, u) => {
    o.push(s._c(u, e, n).then((c) => {
      if (
        // If there are changes, or we are handling a global snapshot, notify
        // secondary clients to update query state.
        (c || n) && s.isPrimaryClient && s.sharedClientState.updateQueryState(u.targetId, c != null && c.fromCache ? "not-current" : "current"), c
      ) {
        r.push(c);
        const h = mr.Ci(u.targetId, c);
        i.push(h);
      }
    }));
  }), await Promise.all(o), s.sc.Wo(r), await async function(a, u) {
    const c = A(a);
    try {
      await c.persistence.runTransaction("notifyLocalViewChanges", "readwrite", (h) => d.forEach(u, (l) => d.forEach(l.Si, (f) => c.persistence.referenceDelegate.addReference(h, l.targetId, f)).next(() => d.forEach(l.Di, (f) => c.persistence.referenceDelegate.removeReference(h, l.targetId, f)))));
    } catch (h) {
      if (!Bt(h)) throw h;
      y("LocalStore", "Failed to update sequence numbers: " + h);
    }
    for (const h of u) {
      const l = h.targetId;
      if (!h.fromCache) {
        const f = c.qi.get(l), g = f.snapshotVersion, T = f.withLastLimboFreeSnapshotVersion(g);
        c.qi = c.qi.insert(l, T);
      }
    }
  }(s.localStore, i));
}
async function Od(t, e) {
  const n = A(t);
  if (!n.currentUser.isEqual(e)) {
    y("SyncEngine", "User change. New user:", e.toKey());
    const s = await Ta(n.localStore, e);
    n.currentUser = e, // Fails tasks waiting for pending writes requested by previous user.
    function(r, i) {
      r.lc.forEach((o) => {
        o.forEach((a) => {
          a.reject(new w(p.CANCELLED, i));
        });
      }), r.lc.clear();
    }(n, "'waitForPendingWrites' promise is rejected due to a user change."), // TODO(b/114226417): Consider calling this only in the primary tab.
    n.sharedClientState.handleUserChange(e, s.removedBatchIds, s.addedBatchIds), await La(n, s.ji);
  }
}
function Ld(t, e) {
  const n = A(t), s = n.cc.get(e);
  if (s && s.nc) return _().add(s.key);
  {
    let r = _();
    const i = n.rc.get(e);
    if (!i) return r;
    for (const o of i) {
      const a = n.ic.get(o);
      r = r.unionWith(a.view.ju);
    }
    return r;
  }
}
function Md(t) {
  const e = A(t);
  return e.remoteStore.remoteSyncer.applyRemoteEvent = xa.bind(null, e), e.remoteStore.remoteSyncer.getRemoteKeysForTarget = Ld.bind(null, e), e.remoteStore.remoteSyncer.rejectListen = Nd.bind(null, e), e.sc.Wo = Td.bind(null, e.eventManager), e.sc.wc = bd.bind(null, e.eventManager), e;
}
class Pd {
  constructor() {
    this.synchronizeTabs = !1;
  }
  async initialize(e) {
    this.yt = Ca(e.databaseInfo.databaseId), this.sharedClientState = this.gc(e), this.persistence = this.yc(e), await this.persistence.start(), this.localStore = this.Ic(e), this.gcScheduler = this.Tc(e, this.localStore), this.indexBackfillerScheduler = this.Ec(e, this.localStore);
  }
  Tc(e, n) {
    return null;
  }
  Ec(e, n) {
    return null;
  }
  Ic(e) {
    return Jl(this.persistence, new Xl(), e.initialUser, this.yt);
  }
  yc(e) {
    return new Wl(gr.Bs, this.yt);
  }
  gc(e) {
    return new sd();
  }
  async terminate() {
    this.gcScheduler && this.gcScheduler.stop(), await this.sharedClientState.shutdown(), await this.persistence.shutdown();
  }
}
class Fd {
  async initialize(e, n) {
    this.localStore || (this.localStore = e.localStore, this.sharedClientState = e.sharedClientState, this.datastore = this.createDatastore(n), this.remoteStore = this.createRemoteStore(n), this.eventManager = this.createEventManager(n), this.syncEngine = this.createSyncEngine(
      n,
      /* startAsPrimary=*/
      !e.synchronizeTabs
    ), this.sharedClientState.onlineStateHandler = (s) => wi(
      this.syncEngine,
      s,
      1
      /* OnlineStateSource.SharedClientState */
    ), this.remoteStore.remoteSyncer.handleCredentialChange = Od.bind(null, this.syncEngine), await md(this.remoteStore, this.syncEngine.isPrimaryClient));
  }
  createEventManager(e) {
    return new vd();
  }
  createDatastore(e) {
    const n = Ca(e.databaseInfo.databaseId), s = (r = e.databaseInfo, new ad(r));
    var r;
    return function(i, o, a, u) {
      return new hd(i, o, a, u);
    }(e.authCredentials, e.appCheckCredentials, s, n);
  }
  createRemoteStore(e) {
    return n = this.localStore, s = this.datastore, r = e.asyncQueue, i = (a) => wi(
      this.syncEngine,
      a,
      0
      /* OnlineStateSource.RemoteStore */
    ), o = gi.C() ? new gi() : new rd(), new dd(n, s, r, i, o);
    var n, s, r, i, o;
  }
  createSyncEngine(e, n) {
    return function(s, r, i, o, a, u, c) {
      const h = new Ad(s, r, i, o, a, u);
      return c && (h.dc = !0), h;
    }(this.localStore, this.remoteStore, this.eventManager, this.sharedClientState, e.initialUser, e.maxConcurrentLimboResolutions, n);
  }
  terminate() {
    return async function(e) {
      const n = A(e);
      y("RemoteStore", "RemoteStore shutting down."), n._u.add(
        5
        /* OfflineCause.Shutdown */
      ), await $t(n), n.mu.shutdown(), // Set the OnlineState to Unknown (rather than Offline) to avoid potentially
      // triggering spurious listener events with cached data, etc.
      n.gu.set(
        "Unknown"
        /* OnlineState.Unknown */
      );
    }(this.remoteStore);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Ud(t, e, n) {
  if (!n) throw new w(p.INVALID_ARGUMENT, `Function ${t}() cannot be called with an empty ${e}.`);
}
function Bd(t, e, n, s) {
  if (e === !0 && s === !0) throw new w(p.INVALID_ARGUMENT, `${t} and ${n} cannot be used together.`);
}
function Ti(t) {
  if (v.isDocumentKey(t)) throw new w(p.INVALID_ARGUMENT, `Invalid collection reference. Collection references must have an odd number of segments, but ${t} has ${t.length}.`);
}
function Vd(t) {
  if (t === void 0) return "undefined";
  if (t === null) return "null";
  if (typeof t == "string") return t.length > 20 && (t = `${t.substring(0, 20)}...`), JSON.stringify(t);
  if (typeof t == "number" || typeof t == "boolean") return "" + t;
  if (typeof t == "object") {
    if (t instanceof Array) return "an array";
    {
      const e = (
        /** try to get the constructor name for an object. */
        function(n) {
          return n.constructor ? n.constructor.name : null;
        }(t)
      );
      return e ? `a custom ${e} object` : "an object";
    }
  }
  return typeof t == "function" ? "a function" : C();
}
function Ps(t, e) {
  if ("_delegate" in t && // Unwrap Compat types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t = t._delegate), !(t instanceof e)) {
    if (e.name === t.constructor.name) throw new w(p.INVALID_ARGUMENT, "Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");
    {
      const n = Vd(t);
      throw new w(p.INVALID_ARGUMENT, `Expected type '${e.name}', but it was: ${n}`);
    }
  }
  return t;
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const bi = /* @__PURE__ */ new Map();
class Ci {
  constructor(e) {
    var n;
    if (e.host === void 0) {
      if (e.ssl !== void 0) throw new w(p.INVALID_ARGUMENT, "Can't provide ssl option if host option is not set");
      this.host = "firestore.googleapis.com", this.ssl = !0;
    } else this.host = e.host, this.ssl = (n = e.ssl) === null || n === void 0 || n;
    if (this.credentials = e.credentials, this.ignoreUndefinedProperties = !!e.ignoreUndefinedProperties, e.cacheSizeBytes === void 0) this.cacheSizeBytes = 41943040;
    else {
      if (e.cacheSizeBytes !== -1 && e.cacheSizeBytes < 1048576) throw new w(p.INVALID_ARGUMENT, "cacheSizeBytes must be at least 1048576");
      this.cacheSizeBytes = e.cacheSizeBytes;
    }
    this.experimentalForceLongPolling = !!e.experimentalForceLongPolling, this.experimentalAutoDetectLongPolling = !!e.experimentalAutoDetectLongPolling, this.useFetchStreams = !!e.useFetchStreams, Bd("experimentalForceLongPolling", e.experimentalForceLongPolling, "experimentalAutoDetectLongPolling", e.experimentalAutoDetectLongPolling);
  }
  isEqual(e) {
    return this.host === e.host && this.ssl === e.ssl && this.credentials === e.credentials && this.cacheSizeBytes === e.cacheSizeBytes && this.experimentalForceLongPolling === e.experimentalForceLongPolling && this.experimentalAutoDetectLongPolling === e.experimentalAutoDetectLongPolling && this.ignoreUndefinedProperties === e.ignoreUndefinedProperties && this.useFetchStreams === e.useFetchStreams;
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Cr {
  /** @hideconstructor */
  constructor(e, n, s, r) {
    this._authCredentials = e, this._appCheckCredentials = n, this._databaseId = s, this._app = r, /**
     * Whether it's a Firestore or Firestore Lite instance.
     */
    this.type = "firestore-lite", this._persistenceKey = "(lite)", this._settings = new Ci({}), this._settingsFrozen = !1;
  }
  /**
   * The {@link @firebase/app#FirebaseApp} associated with this `Firestore` service
   * instance.
   */
  get app() {
    if (!this._app) throw new w(p.FAILED_PRECONDITION, "Firestore was not initialized using the Firebase SDK. 'app' is not available");
    return this._app;
  }
  get _initialized() {
    return this._settingsFrozen;
  }
  get _terminated() {
    return this._terminateTask !== void 0;
  }
  _setSettings(e) {
    if (this._settingsFrozen) throw new w(p.FAILED_PRECONDITION, "Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");
    this._settings = new Ci(e), e.credentials !== void 0 && (this._authCredentials = function(n) {
      if (!n) return new Th();
      switch (n.type) {
        case "gapi":
          const s = n.client;
          return new Ih(s, n.sessionIndex || "0", n.iamToken || null, n.authTokenFactory || null);
        case "provider":
          return n.client;
        default:
          throw new w(p.INVALID_ARGUMENT, "makeAuthCredentialsProvider failed due to invalid credential type");
      }
    }(e.credentials));
  }
  _getSettings() {
    return this._settings;
  }
  _freezeSettings() {
    return this._settingsFrozen = !0, this._settings;
  }
  _delete() {
    return this._terminateTask || (this._terminateTask = this._terminate()), this._terminateTask;
  }
  /** Returns a JSON-serializable representation of this `Firestore` instance. */
  toJSON() {
    return {
      app: this._app,
      databaseId: this._databaseId,
      settings: this._settings
    };
  }
  /**
   * Terminates all components used by this client. Subclasses can override
   * this method to clean up their own dependencies, but must also call this
   * method.
   *
   * Only ever called once.
   */
  _terminate() {
    return function(e) {
      const n = bi.get(e);
      n && (y("ComponentProvider", "Removing Datastore"), bi.delete(e), n.terminate());
    }(this), Promise.resolve();
  }
}
function $d(t, e, n, s = {}) {
  var r;
  const i = (t = Ps(t, Cr))._getSettings();
  if (i.host !== "firestore.googleapis.com" && i.host !== e && Ss("Host has been set in both settings() and useEmulator(), emulator host will be used"), t._setSettings(Object.assign(Object.assign({}, i), {
    host: `${e}:${n}`,
    ssl: !1
  })), s.mockUserToken) {
    let o, a;
    if (typeof s.mockUserToken == "string") o = s.mockUserToken, a = W.MOCK_USER;
    else {
      o = Li(s.mockUserToken, (r = t._app) === null || r === void 0 ? void 0 : r.options.projectId);
      const u = s.mockUserToken.sub || s.mockUserToken.user_id;
      if (!u) throw new w(p.INVALID_ARGUMENT, "mockUserToken must contain 'sub' or 'user_id' field!");
      a = new W(u);
    }
    t._authCredentials = new bh(new Go(o, a));
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ut {
  /** @hideconstructor */
  constructor(e, n, s) {
    this.converter = n, this._key = s, /** The type of this Firestore reference. */
    this.type = "document", this.firestore = e;
  }
  get _path() {
    return this._key.path;
  }
  /**
   * The document's identifier within its collection.
   */
  get id() {
    return this._key.path.lastSegment();
  }
  /**
   * A string representing the path of the referenced document (relative
   * to the root of the database).
   */
  get path() {
    return this._key.path.canonicalString();
  }
  /**
   * The collection this `DocumentReference` belongs to.
   */
  get parent() {
    return new We(this.firestore, this.converter, this._key.path.popLast());
  }
  withConverter(e) {
    return new ut(this.firestore, e, this._key);
  }
}
class jn {
  // This is the lite version of the Query class in the main SDK.
  /** @hideconstructor protected */
  constructor(e, n, s) {
    this.converter = n, this._query = s, /** The type of this Firestore reference. */
    this.type = "query", this.firestore = e;
  }
  withConverter(e) {
    return new jn(this.firestore, e, this._query);
  }
}
class We extends jn {
  /** @hideconstructor */
  constructor(e, n, s) {
    super(e, n, na(s)), this._path = s, /** The type of this Firestore reference. */
    this.type = "collection";
  }
  /** The collection's identifier. */
  get id() {
    return this._query.path.lastSegment();
  }
  /**
   * A string representing the path of the referenced collection (relative
   * to the root of the database).
   */
  get path() {
    return this._query.path.canonicalString();
  }
  /**
   * A reference to the containing `DocumentReference` if this is a
   * subcollection. If this isn't a subcollection, the reference is null.
   */
  get parent() {
    const e = this._path.popLast();
    return e.isEmpty() ? null : new ut(
      this.firestore,
      /* converter= */
      null,
      new v(e)
    );
  }
  withConverter(e) {
    return new We(this.firestore, e, this._path);
  }
}
function Sp(t, e, ...n) {
  if (t = yn(t), Ud("collection", "path", e), t instanceof Cr) {
    const s = x.fromString(e, ...n);
    return Ti(s), new We(
      t,
      /* converter= */
      null,
      s
    );
  }
  {
    if (!(t instanceof ut || t instanceof We)) throw new w(p.INVALID_ARGUMENT, "Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");
    const s = t._path.child(x.fromString(e, ...n));
    return Ti(s), new We(
      t.firestore,
      /* converter= */
      null,
      s
    );
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class qd {
  constructor(e) {
    this.observer = e, /**
     * When set to true, will not raise future events. Necessary to deal with
     * async detachment of listener.
     */
    this.muted = !1;
  }
  next(e) {
    this.observer.next && this.Rc(this.observer.next, e);
  }
  error(e) {
    this.observer.error ? this.Rc(this.observer.error, e) : ge("Uncaught Error in snapshot listener:", e.toString());
  }
  bc() {
    this.muted = !0;
  }
  Rc(e, n) {
    this.muted || setTimeout(() => {
      this.muted || e(n);
    }, 0);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class jd {
  constructor(e, n, s, r) {
    this.authCredentials = e, this.appCheckCredentials = n, this.asyncQueue = s, this.databaseInfo = r, this.user = W.UNAUTHENTICATED, this.clientId = kh.R(), this.authCredentialListener = () => Promise.resolve(), this.appCheckCredentialListener = () => Promise.resolve(), this.authCredentials.start(s, async (i) => {
      y("FirestoreClient", "Received user=", i.uid), await this.authCredentialListener(i), this.user = i;
    }), this.appCheckCredentials.start(s, (i) => (y("FirestoreClient", "Received new app check token=", i), this.appCheckCredentialListener(i, this.user)));
  }
  async getConfiguration() {
    return {
      asyncQueue: this.asyncQueue,
      databaseInfo: this.databaseInfo,
      clientId: this.clientId,
      authCredentials: this.authCredentials,
      appCheckCredentials: this.appCheckCredentials,
      initialUser: this.user,
      maxConcurrentLimboResolutions: 100
    };
  }
  setCredentialChangeListener(e) {
    this.authCredentialListener = e;
  }
  setAppCheckTokenChangeListener(e) {
    this.appCheckCredentialListener = e;
  }
  /**
   * Checks that the client has not been terminated. Ensures that other methods on
   * this class cannot be called after the client is terminated.
   */
  verifyNotTerminated() {
    if (this.asyncQueue.isShuttingDown) throw new w(p.FAILED_PRECONDITION, "The client has already been terminated.");
  }
  terminate() {
    this.asyncQueue.enterRestrictedMode();
    const e = new Ne();
    return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async () => {
      try {
        this.onlineComponents && await this.onlineComponents.terminate(), this.offlineComponents && await this.offlineComponents.terminate(), // The credentials provider must be terminated after shutting down the
        // RemoteStore as it will prevent the RemoteStore from retrieving auth
        // tokens.
        this.authCredentials.shutdown(), this.appCheckCredentials.shutdown(), e.resolve();
      } catch (n) {
        const s = ka(n, "Failed to shutdown persistence");
        e.reject(s);
      }
    }), e.promise;
  }
}
async function Hd(t, e) {
  t.asyncQueue.verifyOperationInProgress(), y("FirestoreClient", "Initializing OfflineComponentProvider");
  const n = await t.getConfiguration();
  await e.initialize(n);
  let s = n.initialUser;
  t.setCredentialChangeListener(async (r) => {
    s.isEqual(r) || (await Ta(e.localStore, r), s = r);
  }), // When a user calls clearPersistence() in one client, all other clients
  // need to be terminated to allow the delete to succeed.
  e.persistence.setDatabaseDeletedListener(() => t.terminate()), t.offlineComponents = e;
}
async function Kd(t, e) {
  t.asyncQueue.verifyOperationInProgress();
  const n = await zd(t);
  y("FirestoreClient", "Initializing OnlineComponentProvider");
  const s = await t.getConfiguration();
  await e.initialize(n, s), // The CredentialChangeListener of the online component provider takes
  // precedence over the offline component provider.
  t.setCredentialChangeListener((r) => yi(e.remoteStore, r)), t.setAppCheckTokenChangeListener((r, i) => yi(e.remoteStore, i)), t.onlineComponents = e;
}
async function zd(t) {
  return t.offlineComponents || (y("FirestoreClient", "Using default OfflineComponentProvider"), await Hd(t, new Pd())), t.offlineComponents;
}
async function Gd(t) {
  return t.onlineComponents || (y("FirestoreClient", "Using default OnlineComponentProvider"), await Kd(t, new Fd())), t.onlineComponents;
}
async function Wd(t) {
  const e = await Gd(t), n = e.eventManager;
  return n.onListen = Dd.bind(null, e.syncEngine), n.onUnlisten = Rd.bind(null, e.syncEngine), n;
}
function Qd(t, e, n = {}) {
  const s = new Ne();
  return t.asyncQueue.enqueueAndForget(async () => function(r, i, o, a, u) {
    const c = new qd({
      next: (l) => {
        i.enqueueAndForget(() => Ed(r, h)), l.fromCache && a.source === "server" ? u.reject(new w(p.UNAVAILABLE, 'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')) : u.resolve(l);
      },
      error: (l) => u.reject(l)
    }), h = new Cd(o, c, {
      includeMetadataChanges: !0,
      Nu: !0
    });
    return wd(r, h);
  }(await Wd(t), t.asyncQueue, e, n, s)), s.promise;
}
class Xd {
  constructor() {
    this.Bc = Promise.resolve(), // A list of retryable operations. Retryable operations are run in order and
    // retried with backoff.
    this.Lc = [], // Is this AsyncQueue being shut down? Once it is set to true, it will not
    // be changed again.
    this.qc = !1, // Operations scheduled to be queued in the future. Operations are
    // automatically removed after they are run or canceled.
    this.Uc = [], // visible for testing
    this.Kc = null, // Flag set while there's an outstanding AsyncQueue operation, used for
    // assertion sanity-checks.
    this.Gc = !1, // Enabled during shutdown on Safari to prevent future access to IndexedDB.
    this.Qc = !1, // List of TimerIds to fast-forward delays for.
    this.jc = [], // Backoff timer used to schedule retries for retryable operations
    this.xo = new Sa(
      this,
      "async_queue_retry"
      /* TimerId.AsyncQueueRetry */
    ), // Visibility handler that triggers an immediate retry of all retryable
    // operations. Meant to speed up recovery when we regain file system access
    // after page comes into foreground.
    this.Wc = () => {
      const n = rs();
      n && y("AsyncQueue", "Visibility state changed to " + n.visibilityState), this.xo.Po();
    };
    const e = rs();
    e && typeof e.addEventListener == "function" && e.addEventListener("visibilitychange", this.Wc);
  }
  get isShuttingDown() {
    return this.qc;
  }
  /**
   * Adds a new operation to the queue without waiting for it to complete (i.e.
   * we ignore the Promise result).
   */
  enqueueAndForget(e) {
    this.enqueue(e);
  }
  enqueueAndForgetEvenWhileRestricted(e) {
    this.zc(), // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.Hc(e);
  }
  enterRestrictedMode(e) {
    if (!this.qc) {
      this.qc = !0, this.Qc = e || !1;
      const n = rs();
      n && typeof n.removeEventListener == "function" && n.removeEventListener("visibilitychange", this.Wc);
    }
  }
  enqueue(e) {
    if (this.zc(), this.qc)
      return new Promise(() => {
      });
    const n = new Ne();
    return this.Hc(() => this.qc && this.Qc ? Promise.resolve() : (e().then(n.resolve, n.reject), n.promise)).then(() => n.promise);
  }
  enqueueRetryable(e) {
    this.enqueueAndForget(() => (this.Lc.push(e), this.Jc()));
  }
  /**
   * Runs the next operation from the retryable queue. If the operation fails,
   * reschedules with backoff.
   */
  async Jc() {
    if (this.Lc.length !== 0) {
      try {
        await this.Lc[0](), this.Lc.shift(), this.xo.reset();
      } catch (e) {
        if (!Bt(e)) throw e;
        y("AsyncQueue", "Operation failed with retryable error: " + e);
      }
      this.Lc.length > 0 && // If there are additional operations, we re-schedule `retryNextOp()`.
      // This is necessary to run retryable operations that failed during
      // their initial attempt since we don't know whether they are already
      // enqueued. If, for example, `op1`, `op2`, `op3` are enqueued and `op1`
      // needs to  be re-run, we will run `op1`, `op1`, `op2` using the
      // already enqueued calls to `retryNextOp()`. `op3()` will then run in the
      // call scheduled here.
      // Since `backoffAndRun()` cancels an existing backoff and schedules a
      // new backoff on every call, there is only ever a single additional
      // operation in the queue.
      this.xo.Ro(() => this.Jc());
    }
  }
  Hc(e) {
    const n = this.Bc.then(() => (this.Gc = !0, e().catch((s) => {
      this.Kc = s, this.Gc = !1;
      const r = (
        /**
        * Chrome includes Error.message in Error.stack. Other browsers do not.
        * This returns expected output of message + stack when available.
        * @param error - Error or FirestoreError
        */
        function(i) {
          let o = i.message || "";
          return i.stack && (o = i.stack.includes(i.message) ? i.stack : i.message + `
` + i.stack), o;
        }(s)
      );
      throw ge("INTERNAL UNHANDLED ERROR: ", r), s;
    }).then((s) => (this.Gc = !1, s))));
    return this.Bc = n, n;
  }
  enqueueAfterDelay(e, n, s) {
    this.zc(), // Fast-forward delays for timerIds that have been overriden.
    this.jc.indexOf(e) > -1 && (n = 0);
    const r = Er.createAndSchedule(this, e, n, s, (i) => this.Yc(i));
    return this.Uc.push(r), r;
  }
  zc() {
    this.Kc && C();
  }
  verifyOperationInProgress() {
  }
  /**
   * Waits until all currently queued tasks are finished executing. Delayed
   * operations are not run.
   */
  async Xc() {
    let e;
    do
      e = this.Bc, await e;
    while (e !== this.Bc);
  }
  /**
   * For Tests: Determine if a delayed operation with a particular TimerId
   * exists.
   */
  Zc(e) {
    for (const n of this.Uc) if (n.timerId === e) return !0;
    return !1;
  }
  /**
   * For Tests: Runs some or all delayed operations early.
   *
   * @param lastTimerId - Delayed operations up to and including this TimerId
   * will be drained. Pass TimerId.All to run all delayed operations.
   * @returns a Promise that resolves once all operations have been run.
   */
  ta(e) {
    return this.Xc().then(() => {
      this.Uc.sort((n, s) => n.targetTimeMs - s.targetTimeMs);
      for (const n of this.Uc) if (n.skipDelay(), e !== "all" && n.timerId === e) break;
      return this.Xc();
    });
  }
  /**
   * For Tests: Skip all subsequent delays for a timer id.
   */
  ea(e) {
    this.jc.push(e);
  }
  /** Called once a DelayedOperation is run or canceled. */
  Yc(e) {
    const n = this.Uc.indexOf(e);
    this.Uc.splice(n, 1);
  }
}
class Ma extends Cr {
  /** @hideconstructor */
  constructor(e, n, s, r) {
    super(e, n, s, r), /**
     * Whether it's a {@link Firestore} or Firestore Lite instance.
     */
    this.type = "firestore", this._queue = new Xd(), this._persistenceKey = (r == null ? void 0 : r.name) || "[DEFAULT]";
  }
  _terminate() {
    return this._firestoreClient || // The client must be initialized to ensure that all subsequent API
    // usage throws an exception.
    Pa(this), this._firestoreClient.terminate();
  }
}
function Yd(t, e) {
  const n = typeof t == "object" ? t : qi(), s = typeof t == "string" ? t : "(default)", r = Bi(n, "firestore").getImmediate({
    identifier: s
  });
  if (!r._initialized) {
    const i = Oi("firestore");
    i && $d(r, ...i);
  }
  return r;
}
function Jd(t) {
  return t._firestoreClient || Pa(t), t._firestoreClient.verifyNotTerminated(), t._firestoreClient;
}
function Pa(t) {
  var e;
  const n = t._freezeSettings(), s = function(r, i, o, a) {
    return new Ph(r, i, o, a.host, a.ssl, a.experimentalForceLongPolling, a.experimentalAutoDetectLongPolling, a.useFetchStreams);
  }(t._databaseId, ((e = t._app) === null || e === void 0 ? void 0 : e.options.appId) || "", t._persistenceKey, n);
  t._firestoreClient = new jd(t._authCredentials, t._appCheckCredentials, t._queue, s);
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class mn {
  /** @hideconstructor */
  constructor(e) {
    this._byteString = e;
  }
  /**
   * Creates a new `Bytes` object from the given Base64 string, converting it to
   * bytes.
   *
   * @param base64 - The Base64 string used to create the `Bytes` object.
   */
  static fromBase64String(e) {
    try {
      return new mn(J.fromBase64String(e));
    } catch (n) {
      throw new w(p.INVALID_ARGUMENT, "Failed to construct data from Base64 string: " + n);
    }
  }
  /**
   * Creates a new `Bytes` object from the given Uint8Array.
   *
   * @param array - The Uint8Array used to create the `Bytes` object.
   */
  static fromUint8Array(e) {
    return new mn(J.fromUint8Array(e));
  }
  /**
   * Returns the underlying bytes as a Base64-encoded string.
   *
   * @returns The Base64-encoded string created from the `Bytes` object.
   */
  toBase64() {
    return this._byteString.toBase64();
  }
  /**
   * Returns the underlying bytes in a new `Uint8Array`.
   *
   * @returns The Uint8Array created from the `Bytes` object.
   */
  toUint8Array() {
    return this._byteString.toUint8Array();
  }
  /**
   * Returns a string representation of the `Bytes` object.
   *
   * @returns A string representation of the `Bytes` object.
   */
  toString() {
    return "Bytes(base64: " + this.toBase64() + ")";
  }
  /**
   * Returns true if this `Bytes` object is equal to the provided one.
   *
   * @param other - The `Bytes` object to compare against.
   * @returns true if this `Bytes` object is equal to the provided one.
   */
  isEqual(e) {
    return this._byteString.isEqual(e._byteString);
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Fa {
  /**
   * Creates a `FieldPath` from the provided field names. If more than one field
   * name is provided, the path will point to a nested field in a document.
   *
   * @param fieldNames - A list of field names.
   */
  constructor(...e) {
    for (let n = 0; n < e.length; ++n) if (e[n].length === 0) throw new w(p.INVALID_ARGUMENT, "Invalid field name at argument $(i + 1). Field names must not be empty.");
    this._internalPath = new se(e);
  }
  /**
   * Returns true if this `FieldPath` is equal to the provided one.
   *
   * @param other - The `FieldPath` to compare against.
   * @returns true if this `FieldPath` is equal to the provided one.
   */
  isEqual(e) {
    return this._internalPath.isEqual(e._internalPath);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Zd {
  /**
   * Creates a new immutable `GeoPoint` object with the provided latitude and
   * longitude values.
   * @param latitude - The latitude as number between -90 and 90.
   * @param longitude - The longitude as number between -180 and 180.
   */
  constructor(e, n) {
    if (!isFinite(e) || e < -90 || e > 90) throw new w(p.INVALID_ARGUMENT, "Latitude must be a number between -90 and 90, but was: " + e);
    if (!isFinite(n) || n < -180 || n > 180) throw new w(p.INVALID_ARGUMENT, "Longitude must be a number between -180 and 180, but was: " + n);
    this._lat = e, this._long = n;
  }
  /**
   * The latitude of this `GeoPoint` instance.
   */
  get latitude() {
    return this._lat;
  }
  /**
   * The longitude of this `GeoPoint` instance.
   */
  get longitude() {
    return this._long;
  }
  /**
   * Returns true if this `GeoPoint` is equal to the provided one.
   *
   * @param other - The `GeoPoint` to compare against.
   * @returns true if this `GeoPoint` is equal to the provided one.
   */
  isEqual(e) {
    return this._lat === e._lat && this._long === e._long;
  }
  /** Returns a JSON-serializable representation of this GeoPoint. */
  toJSON() {
    return {
      latitude: this._lat,
      longitude: this._long
    };
  }
  /**
   * Actually private to JS consumers of our API, so this function is prefixed
   * with an underscore.
   */
  _compareTo(e) {
    return R(this._lat, e._lat) || R(this._long, e._long);
  }
}
const ef = new RegExp("[~\\*/\\[\\]]");
function tf(t, e, n) {
  if (e.search(ef) >= 0) throw Si(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`, t);
  try {
    return new Fa(...e.split("."))._internalPath;
  } catch {
    throw Si(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`, t);
  }
}
function Si(t, e, n, s, r) {
  let i = `Function ${e}() called with invalid data`;
  i += ". ";
  let o = "";
  return new w(p.INVALID_ARGUMENT, i + t + o);
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ua {
  // Note: This class is stripped down version of the DocumentSnapshot in
  // the legacy SDK. The changes are:
  // - No support for SnapshotMetadata.
  // - No support for SnapshotOptions.
  /** @hideconstructor protected */
  constructor(e, n, s, r, i) {
    this._firestore = e, this._userDataWriter = n, this._key = s, this._document = r, this._converter = i;
  }
  /** Property of the `DocumentSnapshot` that provides the document's ID. */
  get id() {
    return this._key.path.lastSegment();
  }
  /**
   * The `DocumentReference` for the document included in the `DocumentSnapshot`.
   */
  get ref() {
    return new ut(this._firestore, this._converter, this._key);
  }
  /**
   * Signals whether or not the document at the snapshot's location exists.
   *
   * @returns true if the document exists.
   */
  exists() {
    return this._document !== null;
  }
  /**
   * Retrieves all fields in the document as an `Object`. Returns `undefined` if
   * the document doesn't exist.
   *
   * @returns An `Object` containing all fields in the document or `undefined`
   * if the document doesn't exist.
   */
  data() {
    if (this._document) {
      if (this._converter) {
        const e = new nf(
          this._firestore,
          this._userDataWriter,
          this._key,
          this._document,
          /* converter= */
          null
        );
        return this._converter.fromFirestore(e);
      }
      return this._userDataWriter.convertValue(this._document.data.value);
    }
  }
  /**
   * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
   * document or field doesn't exist.
   *
   * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
   * field.
   * @returns The data at the specified field location or undefined if no such
   * field exists in the document.
   */
  // We are using `any` here to avoid an explicit cast by our users.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(e) {
    if (this._document) {
      const n = this._document.data.field(Ba("DocumentSnapshot.get", e));
      if (n !== null) return this._userDataWriter.convertValue(n);
    }
  }
}
class nf extends Ua {
  /**
   * Retrieves all fields in the document as an `Object`.
   *
   * @override
   * @returns An `Object` containing all fields in the document.
   */
  data() {
    return super.data();
  }
}
function Ba(t, e) {
  return typeof e == "string" ? tf(t, e) : e instanceof Fa ? e._internalPath : e._delegate._internalPath;
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function sf(t) {
  if (t.limitType === "L" && t.explicitOrderBy.length === 0) throw new w(p.UNIMPLEMENTED, "limitToLast() queries require specifying at least one orderBy() clause");
}
class rf {
  convertValue(e, n = "none") {
    switch (Ue(e)) {
      case 0:
        return null;
      case 1:
        return e.booleanValue;
      case 2:
        return F(e.integerValue || e.doubleValue);
      case 3:
        return this.convertTimestamp(e.timestampValue);
      case 4:
        return this.convertServerTimestamp(e, n);
      case 5:
        return e.stringValue;
      case 6:
        return this.convertBytes(Je(e.bytesValue));
      case 7:
        return this.convertReference(e.referenceValue);
      case 8:
        return this.convertGeoPoint(e.geoPointValue);
      case 9:
        return this.convertArray(e.arrayValue, n);
      case 10:
        return this.convertObject(e.mapValue, n);
      default:
        throw C();
    }
  }
  convertObject(e, n) {
    const s = {};
    return Mn(e.fields, (r, i) => {
      s[r] = this.convertValue(i, n);
    }), s;
  }
  convertGeoPoint(e) {
    return new Zd(F(e.latitude), F(e.longitude));
  }
  convertArray(e, n) {
    return (e.values || []).map((s) => this.convertValue(s, n));
  }
  convertServerTimestamp(e, n) {
    switch (n) {
      case "previous":
        const s = Qo(e);
        return s == null ? null : this.convertValue(s, n);
      case "estimate":
        return this.convertTimestamp(Rt(e));
      default:
        return null;
    }
  }
  convertTimestamp(e) {
    const n = be(e);
    return new re(n.seconds, n.nanos);
  }
  convertDocumentKey(e, n) {
    const s = x.fromString(e);
    U(Ea(s));
    const r = new kt(s.get(1), s.get(3)), i = new v(s.popFirst(5));
    return r.isEqual(n) || // TODO(b/64130202): Somehow support foreign references.
    ge(`Document ${i} contains a document reference within a different database (${r.projectId}/${r.database}) which is not supported. It will be treated as a reference in the current database (${n.projectId}/${n.database}) instead.`), i;
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Xt {
  /** @hideconstructor */
  constructor(e, n) {
    this.hasPendingWrites = e, this.fromCache = n;
  }
  /**
   * Returns true if this `SnapshotMetadata` is equal to the provided one.
   *
   * @param other - The `SnapshotMetadata` to compare against.
   * @returns true if this `SnapshotMetadata` is equal to the provided one.
   */
  isEqual(e) {
    return this.hasPendingWrites === e.hasPendingWrites && this.fromCache === e.fromCache;
  }
}
class of extends Ua {
  /** @hideconstructor protected */
  constructor(e, n, s, r, i, o) {
    super(e, n, s, r, o), this._firestore = e, this._firestoreImpl = e, this.metadata = i;
  }
  /**
   * Returns whether or not the data exists. True if the document exists.
   */
  exists() {
    return super.exists();
  }
  /**
   * Retrieves all fields in the document as an `Object`. Returns `undefined` if
   * the document doesn't exist.
   *
   * By default, `serverTimestamp()` values that have not yet been
   * set to their final value will be returned as `null`. You can override
   * this by passing an options object.
   *
   * @param options - An options object to configure how data is retrieved from
   * the snapshot (for example the desired behavior for server timestamps that
   * have not yet been set to their final value).
   * @returns An `Object` containing all fields in the document or `undefined` if
   * the document doesn't exist.
   */
  data(e = {}) {
    if (this._document) {
      if (this._converter) {
        const n = new tn(
          this._firestore,
          this._userDataWriter,
          this._key,
          this._document,
          this.metadata,
          /* converter= */
          null
        );
        return this._converter.fromFirestore(n, e);
      }
      return this._userDataWriter.convertValue(this._document.data.value, e.serverTimestamps);
    }
  }
  /**
   * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
   * document or field doesn't exist.
   *
   * By default, a `serverTimestamp()` that has not yet been set to
   * its final value will be returned as `null`. You can override this by
   * passing an options object.
   *
   * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
   * field.
   * @param options - An options object to configure how the field is retrieved
   * from the snapshot (for example the desired behavior for server timestamps
   * that have not yet been set to their final value).
   * @returns The data at the specified field location or undefined if no such
   * field exists in the document.
   */
  // We are using `any` here to avoid an explicit cast by our users.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(e, n = {}) {
    if (this._document) {
      const s = this._document.data.field(Ba("DocumentSnapshot.get", e));
      if (s !== null) return this._userDataWriter.convertValue(s, n.serverTimestamps);
    }
  }
}
class tn extends of {
  /**
   * Retrieves all fields in the document as an `Object`.
   *
   * By default, `serverTimestamp()` values that have not yet been
   * set to their final value will be returned as `null`. You can override
   * this by passing an options object.
   *
   * @override
   * @param options - An options object to configure how data is retrieved from
   * the snapshot (for example the desired behavior for server timestamps that
   * have not yet been set to their final value).
   * @returns An `Object` containing all fields in the document.
   */
  data(e = {}) {
    return super.data(e);
  }
}
class af {
  /** @hideconstructor */
  constructor(e, n, s, r) {
    this._firestore = e, this._userDataWriter = n, this._snapshot = r, this.metadata = new Xt(r.hasPendingWrites, r.fromCache), this.query = s;
  }
  /** An array of all the documents in the `QuerySnapshot`. */
  get docs() {
    const e = [];
    return this.forEach((n) => e.push(n)), e;
  }
  /** The number of documents in the `QuerySnapshot`. */
  get size() {
    return this._snapshot.docs.size;
  }
  /** True if there are no documents in the `QuerySnapshot`. */
  get empty() {
    return this.size === 0;
  }
  /**
   * Enumerates all of the documents in the `QuerySnapshot`.
   *
   * @param callback - A callback to be called with a `QueryDocumentSnapshot` for
   * each document in the snapshot.
   * @param thisArg - The `this` binding for the callback.
   */
  forEach(e, n) {
    this._snapshot.docs.forEach((s) => {
      e.call(n, new tn(this._firestore, this._userDataWriter, s.key, s, new Xt(this._snapshot.mutatedKeys.has(s.key), this._snapshot.fromCache), this.query.converter));
    });
  }
  /**
   * Returns an array of the documents changes since the last snapshot. If this
   * is the first snapshot, all documents will be in the list as 'added'
   * changes.
   *
   * @param options - `SnapshotListenOptions` that control whether metadata-only
   * changes (i.e. only `DocumentSnapshot.metadata` changed) should trigger
   * snapshot events.
   */
  docChanges(e = {}) {
    const n = !!e.includeMetadataChanges;
    if (n && this._snapshot.excludesMetadataChanges) throw new w(p.INVALID_ARGUMENT, "To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");
    return this._cachedChanges && this._cachedChangesIncludeMetadataChanges === n || (this._cachedChanges = /** Calculates the array of `DocumentChange`s for a given `ViewSnapshot`. */
    function(s, r) {
      if (s._snapshot.oldDocs.isEmpty()) {
        let i = 0;
        return s._snapshot.docChanges.map((o) => {
          const a = new tn(s._firestore, s._userDataWriter, o.doc.key, o.doc, new Xt(s._snapshot.mutatedKeys.has(o.doc.key), s._snapshot.fromCache), s.query.converter);
          return o.doc, {
            type: "added",
            doc: a,
            oldIndex: -1,
            newIndex: i++
          };
        });
      }
      {
        let i = s._snapshot.oldDocs;
        return s._snapshot.docChanges.filter((o) => r || o.type !== 3).map((o) => {
          const a = new tn(s._firestore, s._userDataWriter, o.doc.key, o.doc, new Xt(s._snapshot.mutatedKeys.has(o.doc.key), s._snapshot.fromCache), s.query.converter);
          let u = -1, c = -1;
          return o.type !== 0 && (u = i.indexOf(o.doc.key), i = i.delete(o.doc.key)), o.type !== 1 && (i = i.add(o.doc), c = i.indexOf(o.doc.key)), {
            type: uf(o.type),
            doc: a,
            oldIndex: u,
            newIndex: c
          };
        });
      }
    }(this, n), this._cachedChangesIncludeMetadataChanges = n), this._cachedChanges;
  }
}
function uf(t) {
  switch (t) {
    case 0:
      return "added";
    case 2:
    case 3:
      return "modified";
    case 1:
      return "removed";
    default:
      return C();
  }
}
class cf extends rf {
  constructor(e) {
    super(), this.firestore = e;
  }
  convertBytes(e) {
    return new mn(e);
  }
  convertReference(e) {
    const n = this.convertDocumentKey(e, this.firestore._databaseId);
    return new ut(
      this.firestore,
      /* converter= */
      null,
      n
    );
  }
}
function Ip(t) {
  t = Ps(t, jn);
  const e = Ps(t.firestore, Ma), n = Jd(e), s = new cf(e);
  return sf(t._query), Qd(n, t._query).then((r) => new af(e, s, t, r));
}
(function(t, e = !0) {
  (function(n) {
    it = n;
  })(Vi), Tt(new Qe("firestore", (n, { instanceIdentifier: s, options: r }) => {
    const i = n.getProvider("app").getImmediate(), o = new Ma(new Ch(n.getProvider("auth-internal")), new Ah(n.getProvider("app-check-internal")), function(a, u) {
      if (!Object.prototype.hasOwnProperty.apply(a.options, ["projectId"])) throw new w(p.INVALID_ARGUMENT, '"projectId" not provided in firebase.initializeApp.');
      return new kt(a.options.projectId, u);
    }(i, s), i);
    return r = Object.assign({
      useFetchStreams: e
    }, r), o._setSettings(r), o;
  }, "PUBLIC").setMultipleInstances(!0)), Ee(Wr, "3.8.0", t), // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
  Ee(Wr, "3.8.0", "esm2017");
})();
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Va = "firebasestorage.googleapis.com", $a = "storageBucket", hf = 2 * 60 * 1e3, lf = 10 * 60 * 1e3;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class B extends Ve {
  /**
   * @param code - A StorageErrorCode string to be prefixed with 'storage/' and
   *  added to the end of the message.
   * @param message  - Error message.
   * @param status_ - Corresponding HTTP Status Code
   */
  constructor(e, n, s = 0) {
    super(is(e), `Firebase Storage: ${n} (${is(e)})`), this.status_ = s, this.customData = { serverResponse: null }, this._baseMessage = this.message, Object.setPrototypeOf(this, B.prototype);
  }
  get status() {
    return this.status_;
  }
  set status(e) {
    this.status_ = e;
  }
  /**
   * Compares a StorageErrorCode against this error's code, filtering out the prefix.
   */
  _codeEquals(e) {
    return is(e) === this.code;
  }
  /**
   * Optional response message that was added by the server.
   */
  get serverResponse() {
    return this.customData.serverResponse;
  }
  set serverResponse(e) {
    this.customData.serverResponse = e, this.customData.serverResponse ? this.message = `${this._baseMessage}
${this.customData.serverResponse}` : this.message = this._baseMessage;
  }
}
function is(t) {
  return "storage/" + t;
}
function Sr() {
  const t = "An unknown error occurred, please check the error payload for server response.";
  return new B("unknown", t);
}
function df(t) {
  return new B("quota-exceeded", "Quota for bucket '" + t + "' exceeded, please view quota on https://firebase.google.com/pricing/.");
}
function ff() {
  const t = "User is not authenticated, please authenticate using Firebase Authentication and try again.";
  return new B("unauthenticated", t);
}
function pf() {
  return new B("unauthorized-app", "This app does not have permission to access Firebase Storage on this project.");
}
function gf(t) {
  return new B("unauthorized", "User does not have permission to access '" + t + "'.");
}
function mf() {
  return new B("retry-limit-exceeded", "Max retry time for operation exceeded, please try again.");
}
function yf() {
  return new B("canceled", "User canceled the upload/download.");
}
function vf(t) {
  return new B("invalid-url", "Invalid URL '" + t + "'.");
}
function wf(t) {
  return new B("invalid-default-bucket", "Invalid default bucket '" + t + "'.");
}
function Ef() {
  return new B("no-default-bucket", "No default bucket found. Did you set the '" + $a + "' property when initializing the app?");
}
function Tf() {
  return new B("cannot-slice-blob", "Cannot slice blob for upload. Please retry the upload.");
}
function bf(t) {
  return new B("unsupported-environment", `${t} is missing. Make sure to install the required polyfills. See https://firebase.google.com/docs/web/environments-js-sdk#polyfills for more information.`);
}
function Fs(t) {
  return new B("invalid-argument", t);
}
function qa() {
  return new B("app-deleted", "The Firebase app was deleted.");
}
function Cf(t) {
  return new B("invalid-root-operation", "The operation '" + t + "' cannot be performed on a root reference, create a non-root reference using child, such as .child('file.png').");
}
function Et(t, e) {
  return new B("invalid-format", "String does not match format '" + t + "': " + e);
}
function lt(t) {
  throw new B("internal-error", "Internal error: " + t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ie {
  constructor(e, n) {
    this.bucket = e, this.path_ = n;
  }
  get path() {
    return this.path_;
  }
  get isRoot() {
    return this.path.length === 0;
  }
  fullServerUrl() {
    const e = encodeURIComponent;
    return "/b/" + e(this.bucket) + "/o/" + e(this.path);
  }
  bucketOnlyServerUrl() {
    return "/b/" + encodeURIComponent(this.bucket) + "/o";
  }
  static makeFromBucketSpec(e, n) {
    let s;
    try {
      s = ie.makeFromUrl(e, n);
    } catch {
      return new ie(e, "");
    }
    if (s.path === "")
      return s;
    throw wf(e);
  }
  static makeFromUrl(e, n) {
    let s = null;
    const r = "([A-Za-z0-9.\\-_]+)";
    function i(L) {
      L.path.charAt(L.path.length - 1) === "/" && (L.path_ = L.path_.slice(0, -1));
    }
    const o = "(/(.*))?$", a = new RegExp("^gs://" + r + o, "i"), u = { bucket: 1, path: 3 };
    function c(L) {
      L.path_ = decodeURIComponent(L.path);
    }
    const h = "v[A-Za-z0-9_]+", l = n.replace(/[.]/g, "\\."), f = "(/([^?#]*).*)?$", g = new RegExp(`^https?://${l}/${h}/b/${r}/o${f}`, "i"), T = { bucket: 1, path: 3 }, D = n === Va ? "(?:storage.googleapis.com|storage.cloud.google.com)" : n, I = "([^?#]*)", ne = new RegExp(`^https?://${D}/${r}/${I}`, "i"), Z = [
      { regex: a, indices: u, postModify: i },
      {
        regex: g,
        indices: T,
        postModify: c
      },
      {
        regex: ne,
        indices: { bucket: 1, path: 2 },
        postModify: c
      }
    ];
    for (let L = 0; L < Z.length; L++) {
      const de = Z[L], ct = de.regex.exec(e);
      if (ct) {
        const jt = ct[de.indices.bucket];
        let Hn = ct[de.indices.path];
        Hn || (Hn = ""), s = new ie(jt, Hn), de.postModify(s);
        break;
      }
    }
    if (s == null)
      throw vf(e);
    return s;
  }
}
class Sf {
  constructor(e) {
    this.promise_ = Promise.reject(e);
  }
  /** @inheritDoc */
  getPromise() {
    return this.promise_;
  }
  /** @inheritDoc */
  cancel(e = !1) {
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function If(t, e, n) {
  let s = 1, r = null, i = null, o = !1, a = 0;
  function u() {
    return a === 2;
  }
  let c = !1;
  function h(...I) {
    c || (c = !0, e.apply(null, I));
  }
  function l(I) {
    r = setTimeout(() => {
      r = null, t(g, u());
    }, I);
  }
  function f() {
    i && clearTimeout(i);
  }
  function g(I, ...ne) {
    if (c) {
      f();
      return;
    }
    if (I) {
      f(), h.call(null, I, ...ne);
      return;
    }
    if (u() || o) {
      f(), h.call(null, I, ...ne);
      return;
    }
    s < 64 && (s *= 2);
    let Z;
    a === 1 ? (a = 2, Z = 0) : Z = (s + Math.random()) * 1e3, l(Z);
  }
  let T = !1;
  function D(I) {
    T || (T = !0, f(), !c && (r !== null ? (I || (a = 2), clearTimeout(r), l(0)) : I || (a = 1)));
  }
  return l(0), i = setTimeout(() => {
    o = !0, D(!0);
  }, n), D;
}
function _f(t) {
  t(!1);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Af(t) {
  return t !== void 0;
}
function Df(t) {
  return typeof t == "object" && !Array.isArray(t);
}
function ja(t) {
  return typeof t == "string" || t instanceof String;
}
function Ii(t) {
  return Ir() && t instanceof Blob;
}
function Ir() {
  return typeof Blob < "u" && !eu();
}
function _i(t, e, n, s) {
  if (s < e)
    throw Fs(`Invalid value for '${t}'. Expected ${e} or greater.`);
  if (s > n)
    throw Fs(`Invalid value for '${t}'. Expected ${n} or less.`);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function kf(t, e, n) {
  let s = e;
  return n == null && (s = `https://${e}`), `${n}://${s}/v0${t}`;
}
function Rf(t) {
  const e = encodeURIComponent;
  let n = "?";
  for (const s in t)
    if (t.hasOwnProperty(s)) {
      const r = e(s) + "=" + e(t[s]);
      n = n + r + "&";
    }
  return n = n.slice(0, -1), n;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Me;
(function(t) {
  t[t.NO_ERROR = 0] = "NO_ERROR", t[t.NETWORK_ERROR = 1] = "NETWORK_ERROR", t[t.ABORT = 2] = "ABORT";
})(Me || (Me = {}));
/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Nf(t, e) {
  const n = t >= 500 && t < 600, r = [
    // Request Timeout: web server didn't receive full request in time.
    408,
    // Too Many Requests: you're getting rate-limited, basically.
    429
  ].indexOf(t) !== -1, i = e.indexOf(t) !== -1;
  return n || r || i;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class xf {
  constructor(e, n, s, r, i, o, a, u, c, h, l, f = !0) {
    this.url_ = e, this.method_ = n, this.headers_ = s, this.body_ = r, this.successCodes_ = i, this.additionalRetryCodes_ = o, this.callback_ = a, this.errorCallback_ = u, this.timeout_ = c, this.progressCallback_ = h, this.connectionFactory_ = l, this.retry = f, this.pendingConnection_ = null, this.backoffId_ = null, this.canceled_ = !1, this.appDelete_ = !1, this.promise_ = new Promise((g, T) => {
      this.resolve_ = g, this.reject_ = T, this.start_();
    });
  }
  /**
   * Actually starts the retry loop.
   */
  start_() {
    const e = (s, r) => {
      if (r) {
        s(!1, new Yt(!1, null, !0));
        return;
      }
      const i = this.connectionFactory_();
      this.pendingConnection_ = i;
      const o = (a) => {
        const u = a.loaded, c = a.lengthComputable ? a.total : -1;
        this.progressCallback_ !== null && this.progressCallback_(u, c);
      };
      this.progressCallback_ !== null && i.addUploadProgressListener(o), i.send(this.url_, this.method_, this.body_, this.headers_).then(() => {
        this.progressCallback_ !== null && i.removeUploadProgressListener(o), this.pendingConnection_ = null;
        const a = i.getErrorCode() === Me.NO_ERROR, u = i.getStatus();
        if ((!a || Nf(u, this.additionalRetryCodes_)) && this.retry) {
          const h = i.getErrorCode() === Me.ABORT;
          s(!1, new Yt(!1, null, h));
          return;
        }
        const c = this.successCodes_.indexOf(u) !== -1;
        s(!0, new Yt(c, i));
      });
    }, n = (s, r) => {
      const i = this.resolve_, o = this.reject_, a = r.connection;
      if (r.wasSuccessCode)
        try {
          const u = this.callback_(a, a.getResponse());
          Af(u) ? i(u) : i();
        } catch (u) {
          o(u);
        }
      else if (a !== null) {
        const u = Sr();
        u.serverResponse = a.getErrorText(), this.errorCallback_ ? o(this.errorCallback_(a, u)) : o(u);
      } else if (r.canceled) {
        const u = this.appDelete_ ? qa() : yf();
        o(u);
      } else {
        const u = mf();
        o(u);
      }
    };
    this.canceled_ ? n(!1, new Yt(!1, null, !0)) : this.backoffId_ = If(e, n, this.timeout_);
  }
  /** @inheritDoc */
  getPromise() {
    return this.promise_;
  }
  /** @inheritDoc */
  cancel(e) {
    this.canceled_ = !0, this.appDelete_ = e || !1, this.backoffId_ !== null && _f(this.backoffId_), this.pendingConnection_ !== null && this.pendingConnection_.abort();
  }
}
class Yt {
  constructor(e, n, s) {
    this.wasSuccessCode = e, this.connection = n, this.canceled = !!s;
  }
}
function Of(t, e) {
  e !== null && e.length > 0 && (t.Authorization = "Firebase " + e);
}
function Lf(t, e) {
  t["X-Firebase-Storage-Version"] = "webjs/" + (e ?? "AppManager");
}
function Mf(t, e) {
  e && (t["X-Firebase-GMPID"] = e);
}
function Pf(t, e) {
  e !== null && (t["X-Firebase-AppCheck"] = e);
}
function Ff(t, e, n, s, r, i, o = !0) {
  const a = Rf(t.urlParams), u = t.url + a, c = Object.assign({}, t.headers);
  return Mf(c, e), Of(c, n), Lf(c, i), Pf(c, s), new xf(u, t.method, c, t.body, t.successCodes, t.additionalRetryCodes, t.handler, t.errorHandler, t.timeout, t.progressCallback, r, o);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Uf() {
  return typeof BlobBuilder < "u" ? BlobBuilder : typeof WebKitBlobBuilder < "u" ? WebKitBlobBuilder : void 0;
}
function Bf(...t) {
  const e = Uf();
  if (e !== void 0) {
    const n = new e();
    for (let s = 0; s < t.length; s++)
      n.append(t[s]);
    return n.getBlob();
  } else {
    if (Ir())
      return new Blob(t);
    throw new B("unsupported-environment", "This browser doesn't seem to support creating Blobs");
  }
}
function Vf(t, e, n) {
  return t.webkitSlice ? t.webkitSlice(e, n) : t.mozSlice ? t.mozSlice(e, n) : t.slice ? t.slice(e, n) : null;
}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function $f(t) {
  if (typeof atob > "u")
    throw bf("base-64");
  return atob(t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const ce = {
  /**
   * Indicates the string should be interpreted "raw", that is, as normal text.
   * The string will be interpreted as UTF-16, then uploaded as a UTF-8 byte
   * sequence.
   * Example: The string 'Hello! \\ud83d\\ude0a' becomes the byte sequence
   * 48 65 6c 6c 6f 21 20 f0 9f 98 8a
   */
  RAW: "raw",
  /**
   * Indicates the string should be interpreted as base64-encoded data.
   * Padding characters (trailing '='s) are optional.
   * Example: The string 'rWmO++E6t7/rlw==' becomes the byte sequence
   * ad 69 8e fb e1 3a b7 bf eb 97
   */
  BASE64: "base64",
  /**
   * Indicates the string should be interpreted as base64url-encoded data.
   * Padding characters (trailing '='s) are optional.
   * Example: The string 'rWmO--E6t7_rlw==' becomes the byte sequence
   * ad 69 8e fb e1 3a b7 bf eb 97
   */
  BASE64URL: "base64url",
  /**
   * Indicates the string is a data URL, such as one obtained from
   * canvas.toDataURL().
   * Example: the string 'data:application/octet-stream;base64,aaaa'
   * becomes the byte sequence
   * 69 a6 9a
   * (the content-type "application/octet-stream" is also applied, but can
   * be overridden in the metadata object).
   */
  DATA_URL: "data_url"
};
class os {
  constructor(e, n) {
    this.data = e, this.contentType = n || null;
  }
}
function qf(t, e) {
  switch (t) {
    case ce.RAW:
      return new os(Ha(e));
    case ce.BASE64:
    case ce.BASE64URL:
      return new os(Ka(t, e));
    case ce.DATA_URL:
      return new os(Hf(e), Kf(e));
  }
  throw Sr();
}
function Ha(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    let s = t.charCodeAt(n);
    if (s <= 127)
      e.push(s);
    else if (s <= 2047)
      e.push(192 | s >> 6, 128 | s & 63);
    else if ((s & 64512) === 55296)
      if (!(n < t.length - 1 && (t.charCodeAt(n + 1) & 64512) === 56320))
        e.push(239, 191, 189);
      else {
        const i = s, o = t.charCodeAt(++n);
        s = 65536 | (i & 1023) << 10 | o & 1023, e.push(240 | s >> 18, 128 | s >> 12 & 63, 128 | s >> 6 & 63, 128 | s & 63);
      }
    else
      (s & 64512) === 56320 ? e.push(239, 191, 189) : e.push(224 | s >> 12, 128 | s >> 6 & 63, 128 | s & 63);
  }
  return new Uint8Array(e);
}
function jf(t) {
  let e;
  try {
    e = decodeURIComponent(t);
  } catch {
    throw Et(ce.DATA_URL, "Malformed data URL.");
  }
  return Ha(e);
}
function Ka(t, e) {
  switch (t) {
    case ce.BASE64: {
      const r = e.indexOf("-") !== -1, i = e.indexOf("_") !== -1;
      if (r || i)
        throw Et(t, "Invalid character '" + (r ? "-" : "_") + "' found: is it base64url encoded?");
      break;
    }
    case ce.BASE64URL: {
      const r = e.indexOf("+") !== -1, i = e.indexOf("/") !== -1;
      if (r || i)
        throw Et(t, "Invalid character '" + (r ? "+" : "/") + "' found: is it base64 encoded?");
      e = e.replace(/-/g, "+").replace(/_/g, "/");
      break;
    }
  }
  let n;
  try {
    n = $f(e);
  } catch (r) {
    throw r.message.includes("polyfill") ? r : Et(t, "Invalid character found");
  }
  const s = new Uint8Array(n.length);
  for (let r = 0; r < n.length; r++)
    s[r] = n.charCodeAt(r);
  return s;
}
class za {
  constructor(e) {
    this.base64 = !1, this.contentType = null;
    const n = e.match(/^data:([^,]+)?,/);
    if (n === null)
      throw Et(ce.DATA_URL, "Must be formatted 'data:[<mediatype>][;base64],<data>");
    const s = n[1] || null;
    s != null && (this.base64 = zf(s, ";base64"), this.contentType = this.base64 ? s.substring(0, s.length - 7) : s), this.rest = e.substring(e.indexOf(",") + 1);
  }
}
function Hf(t) {
  const e = new za(t);
  return e.base64 ? Ka(ce.BASE64, e.rest) : jf(e.rest);
}
function Kf(t) {
  return new za(t).contentType;
}
function zf(t, e) {
  return t.length >= e.length ? t.substring(t.length - e.length) === e : !1;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ye {
  constructor(e, n) {
    let s = 0, r = "";
    Ii(e) ? (this.data_ = e, s = e.size, r = e.type) : e instanceof ArrayBuffer ? (n ? this.data_ = new Uint8Array(e) : (this.data_ = new Uint8Array(e.byteLength), this.data_.set(new Uint8Array(e))), s = this.data_.length) : e instanceof Uint8Array && (n ? this.data_ = e : (this.data_ = new Uint8Array(e.length), this.data_.set(e)), s = e.length), this.size_ = s, this.type_ = r;
  }
  size() {
    return this.size_;
  }
  type() {
    return this.type_;
  }
  slice(e, n) {
    if (Ii(this.data_)) {
      const s = this.data_, r = Vf(s, e, n);
      return r === null ? null : new ye(r);
    } else {
      const s = new Uint8Array(this.data_.buffer, e, n - e);
      return new ye(s, !0);
    }
  }
  static getBlob(...e) {
    if (Ir()) {
      const n = e.map((s) => s instanceof ye ? s.data_ : s);
      return new ye(Bf.apply(null, n));
    } else {
      const n = e.map((o) => ja(o) ? qf(ce.RAW, o).data : o.data_);
      let s = 0;
      n.forEach((o) => {
        s += o.byteLength;
      });
      const r = new Uint8Array(s);
      let i = 0;
      return n.forEach((o) => {
        for (let a = 0; a < o.length; a++)
          r[i++] = o[a];
      }), new ye(r, !0);
    }
  }
  uploadData() {
    return this.data_;
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Gf(t) {
  let e;
  try {
    e = JSON.parse(t);
  } catch {
    return null;
  }
  return Df(e) ? e : null;
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Wf(t) {
  if (t.length === 0)
    return null;
  const e = t.lastIndexOf("/");
  return e === -1 ? "" : t.slice(0, e);
}
function Qf(t, e) {
  const n = e.split("/").filter((s) => s.length > 0).join("/");
  return t.length === 0 ? n : t + "/" + n;
}
function Ga(t) {
  const e = t.lastIndexOf("/", t.length - 2);
  return e === -1 ? t : t.slice(e + 1);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function Xf(t, e) {
  return e;
}
class ee {
  constructor(e, n, s, r) {
    this.server = e, this.local = n || e, this.writable = !!s, this.xform = r || Xf;
  }
}
let Jt = null;
function Yf(t) {
  return !ja(t) || t.length < 2 ? t : Ga(t);
}
function Jf() {
  if (Jt)
    return Jt;
  const t = [];
  t.push(new ee("bucket")), t.push(new ee("generation")), t.push(new ee("metageneration")), t.push(new ee("name", "fullPath", !0));
  function e(i, o) {
    return Yf(o);
  }
  const n = new ee("name");
  n.xform = e, t.push(n);
  function s(i, o) {
    return o !== void 0 ? Number(o) : o;
  }
  const r = new ee("size");
  return r.xform = s, t.push(r), t.push(new ee("timeCreated")), t.push(new ee("updated")), t.push(new ee("md5Hash", null, !0)), t.push(new ee("cacheControl", null, !0)), t.push(new ee("contentDisposition", null, !0)), t.push(new ee("contentEncoding", null, !0)), t.push(new ee("contentLanguage", null, !0)), t.push(new ee("contentType", null, !0)), t.push(new ee("metadata", "customMetadata", !0)), Jt = t, Jt;
}
function Zf(t, e) {
  function n() {
    const s = t.bucket, r = t.fullPath, i = new ie(s, r);
    return e._makeStorageReference(i);
  }
  Object.defineProperty(t, "ref", { get: n });
}
function ep(t, e, n) {
  const s = {};
  s.type = "file";
  const r = n.length;
  for (let i = 0; i < r; i++) {
    const o = n[i];
    s[o.local] = o.xform(s, e[o.server]);
  }
  return Zf(s, t), s;
}
function tp(t, e, n) {
  const s = Gf(e);
  return s === null ? null : ep(t, s, n);
}
function np(t, e) {
  const n = {}, s = e.length;
  for (let r = 0; r < s; r++) {
    const i = e[r];
    i.writable && (n[i.server] = t[i.local]);
  }
  return JSON.stringify(n);
}
class sp {
  constructor(e, n, s, r) {
    this.url = e, this.method = n, this.handler = s, this.timeout = r, this.urlParams = {}, this.headers = {}, this.body = null, this.errorHandler = null, this.progressCallback = null, this.successCodes = [200], this.additionalRetryCodes = [];
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function rp(t) {
  if (!t)
    throw Sr();
}
function ip(t, e) {
  function n(s, r) {
    const i = tp(t, r, e);
    return rp(i !== null), i;
  }
  return n;
}
function op(t) {
  function e(n, s) {
    let r;
    return n.getStatus() === 401 ? /* This exact message string is the only consistent part of the */ /* server's error response that identifies it as an App Check error. */ n.getErrorText().includes("Firebase App Check token is invalid") ? r = pf() : r = ff() : n.getStatus() === 402 ? r = df(t.bucket) : n.getStatus() === 403 ? r = gf(t.path) : r = s, r.status = n.getStatus(), r.serverResponse = s.serverResponse, r;
  }
  return e;
}
function ap(t, e) {
  return t && t.contentType || e && e.type() || "application/octet-stream";
}
function up(t, e, n) {
  const s = Object.assign({}, n);
  return s.fullPath = t.path, s.size = e.size(), s.contentType || (s.contentType = ap(null, e)), s;
}
function cp(t, e, n, s, r) {
  const i = e.bucketOnlyServerUrl(), o = {
    "X-Goog-Upload-Protocol": "multipart"
  };
  function a() {
    let Z = "";
    for (let L = 0; L < 2; L++)
      Z = Z + Math.random().toString().slice(2);
    return Z;
  }
  const u = a();
  o["Content-Type"] = "multipart/related; boundary=" + u;
  const c = up(e, s, r), h = np(c, n), l = "--" + u + `\r
Content-Type: application/json; charset=utf-8\r
\r
` + h + `\r
--` + u + `\r
Content-Type: ` + c.contentType + `\r
\r
`, f = `\r
--` + u + "--", g = ye.getBlob(l, s, f);
  if (g === null)
    throw Tf();
  const T = { name: c.fullPath }, D = kf(i, t.host, t._protocol), I = "POST", ne = t.maxUploadRetryTime, M = new sp(D, I, ip(t, n), ne);
  return M.urlParams = T, M.headers = o, M.body = g.uploadData(), M.errorHandler = op(e), M;
}
class hp {
  constructor() {
    this.sent_ = !1, this.xhr_ = new XMLHttpRequest(), this.initXhr(), this.errorCode_ = Me.NO_ERROR, this.sendPromise_ = new Promise((e) => {
      this.xhr_.addEventListener("abort", () => {
        this.errorCode_ = Me.ABORT, e();
      }), this.xhr_.addEventListener("error", () => {
        this.errorCode_ = Me.NETWORK_ERROR, e();
      }), this.xhr_.addEventListener("load", () => {
        e();
      });
    });
  }
  send(e, n, s, r) {
    if (this.sent_)
      throw lt("cannot .send() more than once");
    if (this.sent_ = !0, this.xhr_.open(n, e, !0), r !== void 0)
      for (const i in r)
        r.hasOwnProperty(i) && this.xhr_.setRequestHeader(i, r[i].toString());
    return s !== void 0 ? this.xhr_.send(s) : this.xhr_.send(), this.sendPromise_;
  }
  getErrorCode() {
    if (!this.sent_)
      throw lt("cannot .getErrorCode() before sending");
    return this.errorCode_;
  }
  getStatus() {
    if (!this.sent_)
      throw lt("cannot .getStatus() before sending");
    try {
      return this.xhr_.status;
    } catch {
      return -1;
    }
  }
  getResponse() {
    if (!this.sent_)
      throw lt("cannot .getResponse() before sending");
    return this.xhr_.response;
  }
  getErrorText() {
    if (!this.sent_)
      throw lt("cannot .getErrorText() before sending");
    return this.xhr_.statusText;
  }
  /** Aborts the request. */
  abort() {
    this.xhr_.abort();
  }
  getResponseHeader(e) {
    return this.xhr_.getResponseHeader(e);
  }
  addUploadProgressListener(e) {
    this.xhr_.upload != null && this.xhr_.upload.addEventListener("progress", e);
  }
  removeUploadProgressListener(e) {
    this.xhr_.upload != null && this.xhr_.upload.removeEventListener("progress", e);
  }
}
class lp extends hp {
  initXhr() {
    this.xhr_.responseType = "text";
  }
}
function dp() {
  return new lp();
}
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Be {
  constructor(e, n) {
    this._service = e, n instanceof ie ? this._location = n : this._location = ie.makeFromUrl(n, e.host);
  }
  /**
   * Returns the URL for the bucket and path this object references,
   *     in the form gs://<bucket>/<object-path>
   * @override
   */
  toString() {
    return "gs://" + this._location.bucket + "/" + this._location.path;
  }
  _newRef(e, n) {
    return new Be(e, n);
  }
  /**
   * A reference to the root of this object's bucket.
   */
  get root() {
    const e = new ie(this._location.bucket, "");
    return this._newRef(this._service, e);
  }
  /**
   * The name of the bucket containing this reference's object.
   */
  get bucket() {
    return this._location.bucket;
  }
  /**
   * The full path of this object.
   */
  get fullPath() {
    return this._location.path;
  }
  /**
   * The short name of this object, which is the last component of the full path.
   * For example, if fullPath is 'full/path/image.png', name is 'image.png'.
   */
  get name() {
    return Ga(this._location.path);
  }
  /**
   * The `StorageService` instance this `StorageReference` is associated with.
   */
  get storage() {
    return this._service;
  }
  /**
   * A `StorageReference` pointing to the parent location of this `StorageReference`, or null if
   * this reference is the root.
   */
  get parent() {
    const e = Wf(this._location.path);
    if (e === null)
      return null;
    const n = new ie(this._location.bucket, e);
    return new Be(this._service, n);
  }
  /**
   * Utility function to throw an error in methods that do not accept a root reference.
   */
  _throwIfRoot(e) {
    if (this._location.path === "")
      throw Cf(e);
  }
}
function fp(t, e, n) {
  t._throwIfRoot("uploadBytes");
  const s = cp(t.storage, t._location, Jf(), new ye(e, !0), n);
  return t.storage.makeRequestWithTokens(s, dp).then((r) => ({
    metadata: r,
    ref: t
  }));
}
function pp(t, e) {
  const n = Qf(t._location.path, e), s = new ie(t._location.bucket, n);
  return new Be(t.storage, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function gp(t) {
  return /^[A-Za-z]+:\/\//.test(t);
}
function mp(t, e) {
  return new Be(t, e);
}
function Wa(t, e) {
  if (t instanceof _r) {
    const n = t;
    if (n._bucket == null)
      throw Ef();
    const s = new Be(n, n._bucket);
    return e != null ? Wa(s, e) : s;
  } else
    return e !== void 0 ? pp(t, e) : t;
}
function yp(t, e) {
  if (e && gp(e)) {
    if (t instanceof _r)
      return mp(t, e);
    throw Fs("To use ref(service, url), the first argument must be a Storage instance.");
  } else
    return Wa(t, e);
}
function Ai(t, e) {
  const n = e == null ? void 0 : e[$a];
  return n == null ? null : ie.makeFromBucketSpec(n, t);
}
function vp(t, e, n, s = {}) {
  t.host = `${e}:${n}`, t._protocol = "http";
  const { mockUserToken: r } = s;
  r && (t._overrideAuthToken = typeof r == "string" ? r : Li(r, t.app.options.projectId));
}
class _r {
  constructor(e, n, s, r, i) {
    this.app = e, this._authProvider = n, this._appCheckProvider = s, this._url = r, this._firebaseVersion = i, this._bucket = null, this._host = Va, this._protocol = "https", this._appId = null, this._deleted = !1, this._maxOperationRetryTime = hf, this._maxUploadRetryTime = lf, this._requests = /* @__PURE__ */ new Set(), r != null ? this._bucket = ie.makeFromBucketSpec(r, this._host) : this._bucket = Ai(this._host, this.app.options);
  }
  /**
   * The host string for this service, in the form of `host` or
   * `host:port`.
   */
  get host() {
    return this._host;
  }
  set host(e) {
    this._host = e, this._url != null ? this._bucket = ie.makeFromBucketSpec(this._url, e) : this._bucket = Ai(e, this.app.options);
  }
  /**
   * The maximum time to retry uploads in milliseconds.
   */
  get maxUploadRetryTime() {
    return this._maxUploadRetryTime;
  }
  set maxUploadRetryTime(e) {
    _i(
      "time",
      /* minValue=*/
      0,
      /* maxValue= */
      Number.POSITIVE_INFINITY,
      e
    ), this._maxUploadRetryTime = e;
  }
  /**
   * The maximum time to retry operations other than uploads or downloads in
   * milliseconds.
   */
  get maxOperationRetryTime() {
    return this._maxOperationRetryTime;
  }
  set maxOperationRetryTime(e) {
    _i(
      "time",
      /* minValue=*/
      0,
      /* maxValue= */
      Number.POSITIVE_INFINITY,
      e
    ), this._maxOperationRetryTime = e;
  }
  async _getAuthToken() {
    if (this._overrideAuthToken)
      return this._overrideAuthToken;
    const e = this._authProvider.getImmediate({ optional: !0 });
    if (e) {
      const n = await e.getToken();
      if (n !== null)
        return n.accessToken;
    }
    return null;
  }
  async _getAppCheckToken() {
    const e = this._appCheckProvider.getImmediate({ optional: !0 });
    return e ? (await e.getToken()).token : null;
  }
  /**
   * Stop running requests and prevent more from being created.
   */
  _delete() {
    return this._deleted || (this._deleted = !0, this._requests.forEach((e) => e.cancel()), this._requests.clear()), Promise.resolve();
  }
  /**
   * Returns a new firebaseStorage.Reference object referencing this StorageService
   * at the given Location.
   */
  _makeStorageReference(e) {
    return new Be(this, e);
  }
  /**
   * @param requestInfo - HTTP RequestInfo object
   * @param authToken - Firebase auth token
   */
  _makeRequest(e, n, s, r, i = !0) {
    if (this._deleted)
      return new Sf(qa());
    {
      const o = Ff(e, this._appId, s, r, n, this._firebaseVersion, i);
      return this._requests.add(o), o.getPromise().then(() => this._requests.delete(o), () => this._requests.delete(o)), o;
    }
  }
  async makeRequestWithTokens(e, n) {
    const [s, r] = await Promise.all([
      this._getAuthToken(),
      this._getAppCheckToken()
    ]);
    return this._makeRequest(e, n, s, r).getPromise();
  }
}
const Di = "@firebase/storage", ki = "0.10.0";
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Qa = "storage";
function _p(t, e, n) {
  return t = yn(t), fp(t, e, n);
}
function Ap(t, e) {
  return t = yn(t), yp(t, e);
}
function wp(t = qi(), e) {
  t = yn(t);
  const s = Bi(t, Qa).getImmediate({
    identifier: e
  }), r = Oi("storage");
  return r && Ep(s, ...r), s;
}
function Ep(t, e, n, s = {}) {
  vp(t, e, n, s);
}
function Tp(t, { instanceIdentifier: e }) {
  const n = t.getProvider("app").getImmediate(), s = t.getProvider("auth-internal"), r = t.getProvider("app-check-internal");
  return new _r(n, s, r, e, Vi);
}
function bp() {
  Tt(new Qe(
    Qa,
    Tp,
    "PUBLIC"
    /* ComponentType.PUBLIC */
  ).setMultipleInstances(!0)), Ee(Di, ki, ""), Ee(Di, ki, "esm2017");
}
bp();
const Cp = {
  apiKey: "AIzaSyAcAaHbimH9lfJ9nx3ma3OCEDKDI2URlIo",
  authDomain: "jobalytics.firebaseapp.com",
  projectId: "jobalytics",
  storageBucket: "jobalytics.appspot.com",
  messagingSenderId: "351217594342",
  appId: "1:351217594342:web:3d299befebae6864f07027",
  measurementId: "G-N7E5N8SE44"
}, Xa = $i(Cp), Dp = Yd(Xa), kp = wp(Xa);
export {
  Xa as app,
  Sp as collection,
  Dp as db,
  Ip as getDocs,
  Ap as ref,
  kp as storage,
  _p as uploadBytes
};
