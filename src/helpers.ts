import { EventData, EventContext, Event } from '.';
import { v4 } from 'uuid';

function defaultContext(): EventContext<{}> {
	return {
		subject: {},
		time: new Date().toISOString()
	};
}

export function createEvent<D extends EventData>(
	{
		event_type,
		event_namespace,
		data,
		context = defaultContext()
	}: {
		event_type: string;
		event_namespace: string;
		data: D;
		context?: EventContext<any>;
	},
	_uuid: () => string = v4,
	_time: () => string = () => new Date().toISOString()
): Event<EventData, EventContext<any>> {
	const d = {
		...(data as object),
		type: `${event_namespace}.${event_type}`,
		event_type,
		event_namespace
	};

	// Allow overriding of time value for testing purposes
	const c: EventContext<any> = {
		...context,
		time: _time()
	};

	return {
		data: d,
		context: c,
		id: _uuid()
	};
}

export function createContext(
	subject: object,
	action?: string,
	_time: () => string = () => new Date().toISOString()
): EventContext<any> {
	return {
		action,
		subject,
		time: _time()
	};
}
