import { test } from 'ava';
import { id } from './test-helpers';
import { createEvent, createContext, EventData, EventContext, Event } from '.';

test('creates an event with default fields filled', t => {
	const evt = createEvent(
		{ event_type: 'Type', event_namespace: 'ns', data: { foo: 'bar' } as any },
		() => id,
		() => '2018-01-02 03-04-05'
	);

	const expected = {
		id,
		data: {
			type: 'ns.Type',
			event_type: 'Type',
			event_namespace: 'ns',
			foo: 'bar'
		},
		context: {
			subject: {},
			time: '2018-01-02 03-04-05'
		}
	};

	t.deepEqual(evt, expected);
});

test('creates an event with a given context', t => {
	const evt = createEvent(
		{
			event_type: 'Type',
			event_namespace: 'ns',
			data: { foo: 'bar' } as any,
			context: { subject: { bar: 'baz' }, time: new Date().toISOString() }
		},
		() => id,
		() => '2018-01-02 03-04-05'
	);

	const expected = {
		id,
		data: {
			type: 'ns.Type',
			event_type: 'Type',
			event_namespace: 'ns',
			foo: 'bar'
		},
		context: {
			subject: { bar: 'baz' },
			time: '2018-01-02 03-04-05'
		}
	};

	t.deepEqual(evt, expected);
});

test('creates a context with subject and no action', t => {
	const evt = createEvent(
		{
			event_type: 'Type',
			event_namespace: 'ns',
			data: { foo: 'bar' } as any,
			context: createContext({ bar: 'baz' })
		},
		() => id,
		() => '2018-01-02 03-04-05'
	);

	t.is(evt.context.action, undefined);
	t.deepEqual(evt.context.subject, { bar: 'baz' });
});

test('creates a context with subject and an action', t => {
	const evt = createEvent(
		{
			event_type: 'Type',
			event_namespace: 'ns',
			data: { foo: 'bar' } as any,
			context: createContext({ bar: 'baz' }, 'someRandomAction', () => '2018-01-02 03-04-05')
		},
		() => id,
		() => '2018-01-02 03-04-05'
	);

	const expected = {
		action: 'someRandomAction',
		subject: { bar: 'baz' },
		time: '2018-01-02 03-04-05'
	};

	t.deepEqual(evt.context, expected);
});
