/**
 * @format
 */

import 'react-native';
import React from 'react';
import {useColorScheme as rnUseColorScheme} from 'react-native';
jest.mock('react-native-sqlite-storage', () => {
  const rows = {
    length: 0,
    item: () => undefined,
    raw: () => [],
  };
  return {
    enablePromise: () => {},
    openDatabase: jest.fn(() =>
      Promise.resolve({
        executeSql: jest.fn(() => Promise.resolve([rows])),
      }),
    ),
  };
});

jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');

import App from '../App';

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer, {act} from 'react-test-renderer';

it('renders correctly', async () => {
  await act(async () => {
    renderer.create(<App />);
  });
});
