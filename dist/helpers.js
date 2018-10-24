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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9oZWxwZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsK0JBQTBCO0FBRTFCLFNBQVMsY0FBYztJQUNyQixPQUFPO1FBQ0wsT0FBTyxFQUFFLEVBQUU7UUFDWCxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDL0IsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQixXQUFXLENBQ3pCLGVBQXVCLEVBQ3ZCLFVBQWtCLEVBQ2xCLElBQVksRUFDWixVQUE2QixjQUFjLEVBQUUsRUFDN0MsUUFBc0IsU0FBRTtJQUV4QixNQUFNLENBQUMscUJBQ0YsSUFBSSxJQUNQLElBQUksRUFBRSxHQUFHLGVBQWUsSUFBSSxVQUFVLEVBQUUsRUFDeEMsVUFBVTtRQUNWLGVBQWUsR0FDaEIsQ0FBQztJQUVGLE9BQU87UUFDTCxJQUFJLEVBQUUsQ0FBQztRQUNQLE9BQU87UUFDUCxFQUFFLEVBQUUsS0FBSyxFQUFFO0tBQ1osQ0FBQztBQUNKLENBQUM7QUFuQkQsa0NBbUJDO0FBRUQsU0FBZ0IsYUFBYSxDQUMzQixPQUFlLEVBQ2YsTUFBZSxFQUNmLFFBQXNCLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0lBRXBELE9BQU87UUFDTCxNQUFNO1FBQ04sT0FBTztRQUNQLElBQUksRUFBRSxLQUFLLEVBQUU7S0FDZCxDQUFDO0FBQ0osQ0FBQztBQVZELHNDQVVDIn0=