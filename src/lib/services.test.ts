// serviceById is the total id→Service lookup that replaced the silent
// `services.find(...)!` in the guide/comparison pages. These tests encode the
// invariant it exists to guarantee: every ServiceId a relation can hold resolves,
// and a bogus id fails loud rather than returning undefined.

import { describe, it, expect } from "vitest";
import { services, serviceById, type ServiceId } from "./services";

describe("serviceById", () => {
  it("resolves every registered ServiceId to its Service", () => {
    for (const s of services) {
      expect(serviceById(s.id)).toBe(s);
    }
  });

  it("throws loud for an unregistered id (no silent undefined)", () => {
    expect(() => serviceById("not-a-service" as ServiceId)).toThrow(
      /no service registered/,
    );
  });
});
