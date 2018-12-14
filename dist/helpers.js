"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
function defaultContext() {
    return {
        subject: {},
        time: new Date().toISOString(),
    };
}
function createEvent(event_namespace, event_type, data, context = defaultContext(), _uuid = uuid_1.v4) {
    const d = Object.assign({}, data, { type: `${event_namespace}.${event_type}`, event_type,
        event_namespace });
    return {
        data: d,
        context,
        id: _uuid(),
    };
}
exports.createEvent = createEvent;
function createContext(subject, action, _time = () => new Date().toISOString()) {
    return {
        action,
        subject,
        time: _time(),
    };
}
exports.createContext = createContext;
function isEventData(o, is) {
    const _is = is || ((_) => true);
    return (o &&
        ((typeof o.event_namespace === 'string' && typeof o.event_type === 'string') ||
            typeof o.type === 'string') &&
        _is(o));
}
exports.isEventData = isEventData;
function isEventContext(o, is) {
    const _is = is || ((_) => true);
    return o && typeof o.time === 'string' && _is(o);
}
exports.isEventContext = isEventContext;
function isEvent(isData, isContext) {
    return function (o) {
        return (o &&
            typeof o.id === 'string' &&
            o.data &&
            isEventData(o.data, isData) &&
            o.context &&
            isEventContext(o.context, isContext));
    };
}
exports.isEvent = isEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsK0JBQTBCO0FBRTFCLFNBQVMsY0FBYztJQUNyQixPQUFPO1FBQ0wsT0FBTyxFQUFFLEVBQUU7UUFDWCxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDL0IsQ0FBQztBQUNKLENBQUM7QUFJRCxTQUFnQixXQUFXLENBQ3pCLGVBQXFDLEVBQ3JDLFVBQTJCLEVBQzNCLElBQXdELEVBQ3hELFVBQTZCLGNBQWMsRUFBRSxFQUM3QyxRQUFzQixTQUFFO0lBRXhCLE1BQU0sQ0FBQyxxQkFFRCxJQUFlLElBQ25CLElBQUksRUFBRSxHQUFHLGVBQWUsSUFBSSxVQUFVLEVBQUUsRUFDeEMsVUFBVTtRQUNWLGVBQWUsR0FDaEIsQ0FBQztJQUVGLE9BQU87UUFDTCxJQUFJLEVBQUUsQ0FBTTtRQUNaLE9BQU87UUFDUCxFQUFFLEVBQUUsS0FBSyxFQUFFO0tBQ1osQ0FBQztBQUNKLENBQUM7QUFwQkQsa0NBb0JDO0FBRUQsU0FBZ0IsYUFBYSxDQUMzQixPQUFlLEVBQ2YsTUFBZSxFQUNmLFFBQXNCLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0lBRXBELE9BQU87UUFDTCxNQUFNO1FBQ04sT0FBTztRQUNQLElBQUksRUFBRSxLQUFLLEVBQUU7S0FDZCxDQUFDO0FBQ0osQ0FBQztBQVZELHNDQVVDO0FBRUQsU0FBZ0IsV0FBVyxDQUFzQixDQUFNLEVBQUUsRUFBdUI7SUFDOUUsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sQ0FDTCxDQUFDO1FBQ0QsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGVBQWUsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FBQztZQUMxRSxPQUFPLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1FBQzdCLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FDUCxDQUFDO0FBQ0osQ0FBQztBQVJELGtDQVFDO0FBRUQsU0FBZ0IsY0FBYyxDQUM1QixDQUFNLEVBQ04sRUFBdUI7SUFFdkIsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFORCx3Q0FNQztBQUVELFNBQWdCLE9BQU8sQ0FDckIsTUFBMEIsRUFDMUIsU0FBOEI7SUFFOUIsT0FBTyxVQUFTLENBQU07UUFDcEIsT0FBTyxDQUNMLENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssUUFBUTtZQUN4QixDQUFDLENBQUMsSUFBSTtZQUNOLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztZQUMzQixDQUFDLENBQUMsT0FBTztZQUNULGNBQWMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUNyQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWRELDBCQWNDIn0=