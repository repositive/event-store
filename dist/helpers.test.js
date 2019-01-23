"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const test_helpers_1 = require("./test-helpers");
const _1 = require(".");
const helpers_1 = require("./helpers");
// This test does nothing, but will fail to compile if Typescript finds errors, so should be left in
ava_1.test("typechecks createEvent", (t) => {
    const evt = _1.createEvent("foobar", "Baz", {
        foo: "hello",
        bar: 10,
    });
    t.pass();
});
ava_1.test("creates an event with default fields filled", (t) => {
    const evt = _1.createEvent("ns", "Type", { foo: "bar" });
    const expected = {
        id: test_helpers_1.id,
        data: {
            type: "ns.Type",
            event_type: "Type",
            event_namespace: "ns",
            foo: "bar",
        },
        context: {
            subject: {},
            time: "2018-01-02 03-04-05",
        },
    };
    t.deepEqual(evt.data, expected.data);
    t.deepEqual(evt.context.subject, expected.context.subject);
    t.is(typeof evt.context.time, "string");
    t.true(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(evt.id));
});
ava_1.test("creates an event with a given context", (t) => {
    const evt = _1.createEvent("ns", "Type", { foo: "bar" }, { subject: { bar: "baz" }, time: "2018-01-02 03-04-05" }, () => test_helpers_1.id);
    const expected = {
        id: test_helpers_1.id,
        data: {
            type: "ns.Type",
            event_type: "Type",
            event_namespace: "ns",
            foo: "bar",
        },
        context: {
            subject: { bar: "baz" },
            time: "2018-01-02 03-04-05",
        },
    };
    t.deepEqual(evt, expected);
});
ava_1.test("creates a context with subject and no action", (t) => {
    const evt = _1.createEvent("ns", "Type", { foo: "bar" }, _1.createContext({ bar: "baz" }), () => test_helpers_1.id);
    t.is(evt.context.action, undefined);
    t.deepEqual(evt.context.subject, { bar: "baz" });
});
ava_1.test("creates a context with subject and an action", (t) => {
    const evt = _1.createEvent("ns", "Type", { foo: "bar" }, _1.createContext({ bar: "baz" }, "someRandomAction", () => "2018-01-02 03-04-05"), () => test_helpers_1.id);
    const expected = {
        action: "someRandomAction",
        subject: { bar: "baz" },
        time: "2018-01-02 03-04-05",
    };
    t.deepEqual(evt.context, expected);
});
ava_1.test("createEvent passes is Event", (t) => {
    const ev = _1.createEvent("ns", "Type", {});
    t.truthy(_1.isEvent((o) => !!o)(ev));
});
ava_1.test("isEventData supports new style events", (t) => {
    const fakeEvent = {
        id: "...",
        data: {
            event_namespace: "some_ns",
            event_type: "SomeType",
            // New fields should override this
            type: "ignoreme.IgnoreMe",
        },
        context: {},
    };
    t.truthy(helpers_1.isEventData(fakeEvent.data, (data) => data.event_namespace === "some_ns" && data.event_type === "SomeType"));
});
ava_1.test("isEventData supports old style events", (t) => {
    const fakeEvent = {
        id: "...",
        data: {
            type: "oldstyle.OldStyle",
        },
        context: {},
    };
    t.truthy(helpers_1.isEventData(fakeEvent.data, (data) => data.type === "oldstyle.OldStyle"));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2hlbHBlcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUEyQjtBQUMzQixpREFBb0M7QUFDcEMsd0JBT1c7QUFDWCx1Q0FBd0M7QUFFeEMsb0dBQW9HO0FBQ3BHLFVBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQU0sRUFBRSxFQUFFO0lBU3hDLE1BQU0sR0FBRyxHQUEwQixjQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRTtRQUM5RCxHQUFHLEVBQUUsT0FBTztRQUNaLEdBQUcsRUFBRSxFQUFFO0tBQ1IsQ0FBQyxDQUFDO0lBRUgsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUM7QUFFSCxVQUFJLENBQUMsNkNBQTZDLEVBQUUsQ0FBQyxDQUFNLEVBQUUsRUFBRTtJQUM3RCxNQUFNLEdBQUcsR0FBRyxjQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBRXRELE1BQU0sUUFBUSxHQUFHO1FBQ2YsRUFBRSxFQUFGLGlCQUFFO1FBQ0YsSUFBSSxFQUFFO1lBQ0osSUFBSSxFQUFFLFNBQVM7WUFDZixVQUFVLEVBQUUsTUFBTTtZQUNsQixlQUFlLEVBQUUsSUFBSTtZQUNyQixHQUFHLEVBQUUsS0FBSztTQUNYO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsT0FBTyxFQUFFLEVBQUU7WUFDWCxJQUFJLEVBQUUscUJBQXFCO1NBQzVCO0tBQ0YsQ0FBQztJQUVGLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNE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