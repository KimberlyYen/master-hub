import {
  resolveUserStorageKey,
  preferencesStorageKey,
  loadPreferencesForUser,
  LEGACY_PREFERENCES_KEY,
} from "./userStorageKey";

describe("resolveUserStorageKey", () => {
  it("Google 登入使用者以 email 為 key", () => {
    expect(
      resolveUserStorageKey(
        { user: { email: "User@Gmail.com" }, expires: "" },
        false
      )
    ).toBe("user@gmail.com");
  });

  it("訪客模式使用 guest key", () => {
    expect(resolveUserStorageKey(null, true)).toBe("guest");
  });
});

describe("loadPreferencesForUser", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("登入後從 guest 志願遷移", () => {
    localStorage.setItem(
      preferencesStorageKey("guest"),
      JSON.stringify(["cycu-im", null, null])
    );

    const prefs = loadPreferencesForUser("alice@gmail.com");

    expect(prefs).toEqual(["cycu-im", null, null]);
    expect(localStorage.getItem(preferencesStorageKey("alice@gmail.com"))).toBe(
      JSON.stringify(["cycu-im", null, null])
    );
  });

  it("從舊版全域 key 遷移", () => {
    localStorage.setItem(
      LEGACY_PREFERENCES_KEY,
      JSON.stringify([null, "tku-im", null])
    );

    const prefs = loadPreferencesForUser("bob@gmail.com");

    expect(prefs[1]).toBe("tku-im");
  });
});
