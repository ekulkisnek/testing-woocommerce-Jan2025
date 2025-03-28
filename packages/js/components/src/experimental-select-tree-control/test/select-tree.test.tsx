import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, useState } from 'react';
import React, { createElement } from '@wordpress/element';
import { SelectTree } from '../select-tree';
import { Item } from '../../experimental-tree-control';

const mockItems: Item[] = [
	{
		label: 'Item 1',
		value: 'item-1',
	},
	{
		label: 'Item 2',
		value: 'item-2',
		parent: 'item-1',
	},
	{
		label: 'Item 3',
		value: 'item-3',
	},
];

const DEFAULT_PROPS = {
	id: 'select-tree',
	items: mockItems,
	label: 'Select Tree',
	placeholder: 'Type here',
};

const TestComponent = ( { multiple }: { multiple?: boolean } ) => {
	const [ typedValue, setTypedValue ] = useState( '' );
	const [ selected, setSelected ] = useState< any >( [] );

	return createElement( SelectTree, {
		...DEFAULT_PROPS,
		multiple,
		shouldShowCreateButton: () => true,
		onInputChange: ( value ) => {
			setTypedValue( value || '' );
		},
		createValue: typedValue,
		selected: Array.isArray( selected )
			? selected.map( ( i ) => ( {
					value: String( i.id ),
					label: i.name,
			  } ) )
			: {
					value: String( selected.id ),
					label: selected.name,
			  },
		onSelect: ( item: Item | Item[] ) =>
			item && Array.isArray( item )
				? setSelected(
						item.map( ( i ) => ( {
							id: +i.value,
							name: i.label,
							parent: i.parent ? +i.parent : 0,
						} ) )
				  )
				: setSelected( {
						id: +item.value,
						name: item.label,
						parent: item.parent ? +item.parent : 0,
				  } ),
	} );
};

describe( 'SelectTree', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should show the popover only when focused', async () => {
		const { queryByRole, queryByText } = render(
			<SelectTree { ...DEFAULT_PROPS } />
		);
		expect( queryByText( 'Item 1' ) ).not.toBeInTheDocument();
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		expect( queryByText( 'Item 1' ) ).toBeInTheDocument();
	} );

	it( 'should show create button when callback is true ', async () => {
		const { queryByText, queryByRole } = render(
			<SelectTree
				{ ...DEFAULT_PROPS }
				shouldShowCreateButton={ () => true }
			/>
		);
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		expect( queryByText( 'Create new' ) ).toBeInTheDocument();
	} );
	it( 'should not show create button when callback is false or no callback', async () => {
		const { queryByText, queryByRole } = render(
			<SelectTree { ...DEFAULT_PROPS } />
		);
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		expect( queryByText( 'Create new' ) ).not.toBeInTheDocument();
	} );
	it( 'should show a root item when focused and child when expand button is clicked', async () => {
		const { queryByText, queryByLabelText, queryByRole } = render(
			<SelectTree { ...DEFAULT_PROPS } />
		);
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		expect( queryByText( 'Item 1' ) ).toBeInTheDocument();

		expect( queryByText( 'Item 2' ) ).not.toBeInTheDocument();
		await act( () => {
			userEvent.click( queryByLabelText( 'Expand' )! );
		} );
		expect( queryByText( 'Item 2' ) ).toBeInTheDocument();
	} );

	it( 'should show selected items', async () => {
		const { queryAllByRole, queryByRole } = render(
			<SelectTree { ...DEFAULT_PROPS } selected={ [ mockItems[ 0 ] ] } />
		);
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		expect( queryAllByRole( 'treeitem' )[ 0 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );

	it( 'should show Create "<createValue>" button', async () => {
		const { queryByText, queryByRole } = render(
			<SelectTree
				{ ...DEFAULT_PROPS }
				createValue="new item"
				shouldShowCreateButton={ () => true }
			/>
		);
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		expect( queryByText( 'Create "new item"' ) ).toBeInTheDocument();
	} );
	it( 'should call onCreateNew when Create "<createValue>" button is clicked', async () => {
		const mockFn = jest.fn();
		const { queryByRole, queryByText } = render(
			<SelectTree
				{ ...DEFAULT_PROPS }
				createValue="new item"
				shouldShowCreateButton={ () => true }
				onCreateNew={ mockFn }
			/>
		);
		await act( () => {
			fireEvent.focus( queryByRole( 'combobox' )! );
		} );
		await act( () => {
			queryByText( 'Create "new item"' )?.click();
		} );
		expect( mockFn ).toBeCalledTimes( 1 );
	} );
	it( 'correctly selects existing item in single mode with arrow keys', async () => {
		const { findByRole } = render( <TestComponent /> );
		const combobox = ( await findByRole( 'combobox' ) ) as HTMLInputElement;
		await act( () => {
			combobox.focus();
		} );
		userEvent.keyboard( '{arrowdown}{enter}' );
		expect( combobox.value ).toBe( 'Item 1' );
	} );
	it( 'correctly selects existing item in single mode by typing and pressing Enter', async () => {
		const { findByRole } = render( <TestComponent /> );
		const combobox = ( await findByRole( 'combobox' ) ) as HTMLInputElement;
		await act( () => {
			combobox.focus();
		} );
		userEvent.keyboard( 'Item 1{enter}' );
		userEvent.tab();
		expect( combobox.value ).toBe( 'Item 1' );
	} );
	it( 'correctly selects existing item in multiple mode by typing and pressing Enter', async () => {
		const { findByRole, getAllByText } = render(
			<TestComponent multiple />
		);
		const combobox = ( await findByRole( 'combobox' ) ) as HTMLInputElement;
		await act( () => {
			fireEvent.focus( combobox );
		} );
		userEvent.keyboard( 'Item 1' );
		userEvent.keyboard( '{enter}' );
		expect( combobox.value ).toBe( '' ); // input is cleared
		expect( getAllByText( 'Item 1' )[ 0 ] ).toBeInTheDocument(); // item is selected (turns into a token)
	} );
} );
