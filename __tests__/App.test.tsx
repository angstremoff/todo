/**
 * @format
 */

import 'react-native';
import React from 'react';

jest.mock('../src/db/tasks', () => ({
  getTasks: jest.fn().mockResolvedValue([]),
  createTask: jest.fn(),
  deleteTask: jest.fn(),
  updateTaskStatus: jest.fn(),
  getWorkspaces: jest.fn().mockResolvedValue([{id: 1, name: 'Рабочее'}]),
  createWorkspace: jest.fn(),
  renameWorkspace: jest.fn(),
}));

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
