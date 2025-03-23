/**
 * Internal dependencies
 */
import { registerProductEditorBlockType } from '../../../utils';

/**
 * Internal dependencies
 */
import blockConfiguration from './block.json';
import { Edit } from './edit';

const { name, ...metadata } = blockConfiguration;

export { metadata, name };

export const settings = {
	example: {},
	edit: Edit,
};

export const init = () =>
	registerProductEditorBlockType( {
		name,
		metadata: metadata as never,
		settings: settings as never,
	} );
