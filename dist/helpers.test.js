"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const test_helpers_1 = require("./test-helpers");
const _1 = require(".");
ava_1.test('creates an event with default fields filled', (t) => {
    const evt = _1.createEvent('ns', 'Type', { foo: 'bar' });
    const expected = {
        id: test_helpers_1.id,
        data: {
            type: 'ns.Type',
            event_type: 'Type',
            event_namespace: 'ns',
            foo: 'bar',
        },
        context: {
            subject: {},
            time: '2018-01-02 03-04-05',
        },
    };
    t.deepEqual(evt.data, expected.data);
    t.deepEqual(evt.context.subject, expected.context.subject);
    t.is(typeof evt.context.time, 'string');
    t.true(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(evt.id));
});
ava_1.test('creates an event with a given context', (t) => {
    const evt = _1.createEvent('ns', 'Type', { foo: 'bar' }, { subject: { bar: 'baz' }, time: '2018-01-02 03-04-05' }, () => test_helpers_1.id);
    const expected = {
        id: test_helpers_1.id,
        data: {
            type: 'ns.Type',
            event_type: 'Type',
            event_namespace: 'ns',
            foo: 'bar',
        },
        context: {
            subject: { bar: 'baz' },
            time: '2018-01-02 03-04-05',
        },
    };
    t.deepEqual(evt, expected);
});
ava_1.test('creates a context with subject and no action', (t) => {
    const evt = _1.createEvent('ns', 'Type', { foo: 'bar' }, _1.createContext({ bar: 'baz' }), () => test_helpers_1.id);
    t.is(evt.context.action, undefined);
    t.deepEqual(evt.context.subject, { bar: 'baz' });
});
ava_1.test('creates a context with subject and an action', (t) => {
    const evt = _1.createEvent('ns', 'Type', { foo: 'bar' }, _1.createContext({ bar: 'baz' }, 'someRandomAction', () => '2018-01-02 03-04-05'), () => test_helpers_1.id);
    const expected = {
        action: 'someRandomAction',
        subject: { bar: 'baz' },
        time: '2018-01-02 03-04-05',
    };
    t.deepEqual(evt.context, expected);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2hlbHBlcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUEyQjtBQUMzQixpREFBb0M7QUFDcEMsd0JBQStFO0FBRS9FLFVBQUksQ0FBQyw2Q0FBNkMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ3hELE1BQU0sR0FBRyxHQUFHLGNBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFdEQsTUFBTSxRQUFRLEdBQUc7UUFDZixFQUFFLEVBQUYsaUJBQUU7UUFDRixJQUFJLEVBQUU7WUFDSixJQUFJLEVBQUUsU0FBUztZQUNmLFVBQVUsRUFBRSxNQUFNO1lBQ2xCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLEdBQUcsRUFBRSxLQUFLO1NBQ1g7UUFDRCxPQUFPLEVBQUU7WUFDUCxPQUFPLEVBQUUsRUFBRTtZQUNYLElBQUksRUFBRSxxQkFBcUI7U0FDNUI7S0FDRixDQUFDO0lBRUYsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLENBQUMsQ0FBQyxJQUFJLENBQUMsK0RBQStELENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3ZGLENBQUMsQ0FBQyxDQUFDO0FBRUgsVUFBSSxDQUFDLHVDQUF1QyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7SUFDbEQsTUFBTSxHQUFHLEdBQUcsY0FBVyxDQUNyQixJQUFJLEVBQ0osTUFBTSxFQUNOLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUNkLEVBQUUsT0FBTyxFQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxFQUN4RCxHQUFHLEVBQUUsQ0FBQyxpQkFBRSxDQUNULENBQUM7SUFFRixNQUFNLFFBQVEsR0FBRztRQUNmLEVBQUUsRUFBRixpQkFBRTtRQUNGLElBQUksRUFBRTtZQUNKLElBQUksRUFBRSxTQUFTO1lBQ2YsVUFBVSxFQUFFLE1BQU07WUFDbEIsZUFBZSxFQUFFLElBQUk7WUFDckIsR0FBRyxFQUFFLEtBQUs7U0FDWDtRQUNELE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUU7WUFDdkIsSUFBSSxFQUFFLHFCQUFxQjtTQUM1QjtLQUNGLENBQUM7SUFFRixDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQztBQUVILFVBQUksQ0FBQyw4Q0FBOEMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO0lBQ3pELE1BQU0sR0FBRyxHQUFHLGNBQVcsQ0FDckIsSUFBSSxFQUNKLE1BQU0sRUFDTixFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFDZCxnQkFBYSxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQzdCLEdBQUcsRUFBRSxDQUFDLGlCQUFFLENBQ1QsQ0FBQztJQUVGLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDcEMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQ25ELENBQUMsQ0FBQyxDQUFDO0FBRUgsVUFBSSxDQUFDLDhDQUE4QyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7SUFDekQsTUFBTSxHQUFHLEdBQUcsY0FBVyxDQUNyQixJQUFJLEVBQ0osTUFBTSxFQUNOLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUNkLGdCQUFhLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsRUFDOUUsR0FBRyxFQUFFLENBQUMsaUJBQUUsQ0FDVCxDQUFDO0lBRUYsTUFBTSxRQUFRLEdBQUc7UUFDZixNQUFNLEVBQUUsa0JBQWtCO1FBQzFCLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUU7UUFDdkIsSUFBSSxFQUFFLHFCQUFxQjtLQUM1QixDQUFDO0lBRUYsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDQUFDIn0=