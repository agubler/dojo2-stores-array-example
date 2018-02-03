import { WidgetBase } from '@dojo/widget-core/WidgetBase';
import { v } from '@dojo/widget-core/d';
import { Store } from '@dojo/stores/Store';
import { Container } from '@dojo/widget-core/Container';
import { Injector } from '@dojo/widget-core/Injector';
import { Registry }  from '@dojo/widget-core/Registry';
import { ProjectorMixin } from '@dojo/widget-core/mixins/Projector';
import { createProcess, createCommandFactory } from '@dojo/stores/process';
import { replace } from '@dojo/stores/state/operations';
import uuid from '@dojo/core/uuid';

// interfaces
interface A {
    blist: B[]
}

interface B {
    prop1: string;
}

interface State {
    a: A[]
}

// Process and commands
const commandFactory = createCommandFactory<State>();

// Command to update the deep array
const commandOne = commandFactory(({ at, path }) => {
	const targetPath = path(at(path(at(path('a'), 0), 'blist'), 0), 'prop1');
	return [
		replace(targetPath, uuid())
	];
});

const process = createProcess([commandOne]);

// Widget
class MyWidget extends WidgetBase<{ prop1: string, update: () => void }> {

	render() {
		return v('div', [
			v('button', { onclick: this.properties.update }, [ 'update text' ]),
			v('span', { styles: { marginLeft: '20px' }}, [ this.properties.prop1 ])
		]);
	}

}

// Container
function getProperties(store: Store<State>) {
	const { at, path, get } = store;
	return {
		prop1: get(at(path(at(path('a'), 0), 'blist'), 0)).prop1,
		update: process(store)
	};
}

const container = Container(MyWidget, 'state', { getProperties })

// Main File

// Injector to attach store invalidations to container invalidations
class StoreInjector extends Injector {
	constructor(payload: Store) {
		super(payload);
		payload.on('invalidate', () => {
			this.emit({ type: 'invalidate' });
		});
	}
}

const store = new Store<State>();
const registry = new Registry();
registry.defineInjector('state', new StoreInjector(store));

// Create Initial state
process(store)({});

const MyWidgetContainer = ProjectorMixin(container);
const projector = new MyWidgetContainer();
projector.setProperties({ registry });
projector.append();

// Changes the deep array every second
const intervalHandle = setInterval(() => {
	process(store)({});
	console.log(store.get(store.at(store.path(store.at(store.path('a'), 0), 'blist'), 0)).prop1);
}, 1000);

// clear the interval after 10 seconds
setTimeout(() => {
	clearInterval(intervalHandle);
}, 10000);

