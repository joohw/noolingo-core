import { setAdapter } from '../src/adapter';
import { createStubNoolingoAdapter } from './stubAdapters';

/**
 * 必须先注入适配器，再加载 `src/index`（否则会触发 store 等在模块加载期读 adapter）。
 */
async function main() {
    const adapter = createStubNoolingoAdapter();
    setAdapter(adapter);
    const { Noolingo } = await import('../src/index');
    const noolingo = new Noolingo(adapter);
    try {
        await noolingo.init();
        console.log('initServices finished.');
    } catch (e) {
        console.warn(
            'initServices threw (stub 后端/网络未实现时属正常):',
            e,
        );
    }
}

void main();
