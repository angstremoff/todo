import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useColorScheme,
} from 'react-native';
import {SegmentedControl} from './src/components/SegmentedControl';
import {TaskCard} from './src/components/TaskCard';
import {EmptyState} from './src/components/EmptyState';
import {
  createTask,
  createWorkspace,
  deleteTask,
  getTasks,
  getWorkspaces,
  renameWorkspace,
  updateTaskStatus,
} from './src/db/tasks';
import {Task, Workspace} from './src/types';
import {
  ThemeContext,
  ThemeMode,
  darkTheme,
  lightTheme,
} from './src/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabKey = 'active' | 'done';

const App = (): React.JSX.Element => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    systemScheme === 'dark' ? 'dark' : 'light',
  );
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [workspaceModalVisible, setWorkspaceModalVisible] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);

  useEffect(() => {
    setThemeMode(systemScheme === 'dark' ? 'dark' : 'light');
  }, [systemScheme]);

  const theme = useMemo(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode],
  );

  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
      if (!selectedWorkspaceId && data.length > 0) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (e) {
      setError('Не удалось загрузить пространства');
    }
  }, [selectedWorkspaceId]);

  const loadTasks = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getTasks(
        selectedWorkspaceId,
        activeTab === 'active' ? 'active' : 'done',
      );
      setTasks(data);
    } catch (e) {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedWorkspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleTheme = () => {
    LayoutAnimation.easeInEaseOut();
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const resetTaskForm = () => {
    setTaskText('');
    setError(null);
  };

  const handleCreateTask = async () => {
    if (!taskText.trim()) {
      setError('Введите текст задачи');
      return;
    }
    if (!selectedWorkspaceId) {
      setError('Создайте или выберите пространство');
      return;
    }
    try {
      setSaving(true);
      await createTask({text: taskText, workspaceId: selectedWorkspaceId});
      resetTaskForm();
      setModalVisible(false);
      if (activeTab !== 'active') {
        setActiveTab('active');
      }
      await loadTasks();
    } catch (e) {
      setError('Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const nextStatus = task.status === 'done' ? 'active' : 'done';
      await updateTaskStatus(task.id, nextStatus);
      LayoutAnimation.easeInEaseOut();
      await loadTasks();
    } catch (e) {
      setError('Не удалось обновить задачу');
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id);
      LayoutAnimation.easeInEaseOut();
      await loadTasks();
    } catch (e) {
      setError('Не удалось удалить задачу');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setError('Введите название пространства');
      return;
    }
    try {
      setWorkspaceSaving(true);
      const ws = await createWorkspace(workspaceName.trim());
      setWorkspaceName('');
      setWorkspaceModalVisible(false);
      setWorkspaces(prev => [...prev, ws]);
      setSelectedWorkspaceId(ws.id);
    } catch (e) {
      setError('Не удалось создать пространство');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleRenameWorkspace = async () => {
    if (!renameValue.trim() || !selectedWorkspaceId) {
      setError('Введите новое имя');
      return;
    }
    try {
      setWorkspaceSaving(true);
      await renameWorkspace(selectedWorkspaceId, renameValue.trim());
      setWorkspaces(prev =>
        prev.map(w =>
          w.id === selectedWorkspaceId ? {...w, name: renameValue.trim()} : w,
        ),
      );
      setRenameModalVisible(false);
    } catch (e) {
      setError('Не удалось переименовать пространство');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const renderTask = ({item}: {item: Task}) => (
    <TaskCard
      task={item}
      theme={theme}
      onToggleStatus={handleToggleStatus}
      onDelete={item.status === 'done' ? handleDelete : undefined}
    />
  );

  const listEmpty = (
    <EmptyState
      title={
        activeTab === 'active'
          ? 'Здесь пока пусто'
          : 'Архив чист — круто!'
      }
      subtitle={
        activeTab === 'active'
          ? 'Добавьте первую задачу в выбранное пространство.'
          : 'Выполненные задачи появятся здесь.'
      }
      actionLabel={activeTab === 'active' ? 'Добавить' : undefined}
      onAction={
        activeTab === 'active' ? () => setModalVisible(true) : undefined
      }
      theme={theme}
    />
  );

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      <SafeAreaView
        style={[styles.safeArea, {backgroundColor: theme.colors.background}]}>
        <StatusBar
          barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View
          style={[styles.container, {backgroundColor: theme.colors.background}]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={toggleTheme}
              style={({pressed}) => [
                styles.themeToggle,
                {
                  backgroundColor: pressed
                    ? theme.colors.accentMuted
                    : theme.colors.accent,
                },
              ]}>
              <Text style={styles.themeToggleText}>
                {themeMode === 'dark' ? '☀︎' : '☾'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.workspaceHeader}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Рабочие пространства
            </Text>
            <Pressable
              onPress={() => {
                setError(null);
                setWorkspaceModalVisible(true);
              }}
              style={({pressed}) => [
                styles.linkButton,
                {
                  backgroundColor: pressed
                    ? theme.colors.accentMuted
                    : theme.colors.accent,
                },
              ]}>
              <Text style={styles.linkButtonText}>+ Создать</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workspaceList}>
            {workspaces.map(space => {
              const selected = space.id === selectedWorkspaceId;
              return (
                <Pressable
                  key={space.id}
                  onPress={() => {
                    setSelectedWorkspaceId(space.id);
                    setError(null);
                  }}
                  style={({pressed}) => [
                    styles.workspacePill,
                    {
                      backgroundColor: selected
                        ? theme.colors.accent
                        : theme.colors.card,
                      borderColor: selected
                        ? theme.colors.accent
                        : theme.colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.workspaceText,
                      {color: selected ? '#0B1224' : theme.colors.text},
                    ]}>
                    {space.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {selectedWorkspace ? (
            <Pressable
              onPress={() => {
                setRenameValue(selectedWorkspace.name);
                setRenameModalVisible(true);
              }}
              style={({pressed}) => [
                styles.renameButton,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: pressed
                    ? theme.colors.border
                    : theme.colors.card,
                },
              ]}>
              <Text style={[styles.renameText, {color: theme.colors.muted}]}>
                Переименовать выбранное
              </Text>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.segmentWrapper,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}>
            <SegmentedControl
              options={[
                {label: 'Текущие', value: 'active'},
                {label: 'Архив', value: 'done'},
              ]}
              value={activeTab}
              onChange={value => setActiveTab(value)}
              theme={theme}
            />
          </View>

          {error ? (
            <Text style={[styles.error, {color: theme.colors.danger}]}>
              {error}
            </Text>
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.accent} />
            </View>
          ) : (
            <FlatList
              data={tasks}
              keyExtractor={item => item.id.toString()}
              renderItem={renderTask}
              contentContainerStyle={[styles.listContent, {paddingBottom: 120}]}
              ItemSeparatorComponent={() => <View style={{height: 12}} />}
              ListEmptyComponent={listEmpty}
              showsVerticalScrollIndicator={false}
            />
          )}

          <Pressable
            onPress={() => setModalVisible(true)}
            style={({pressed}) => [
              styles.fab,
              {
                backgroundColor: pressed
                  ? theme.colors.accentMuted
                  : theme.colors.accent,
                shadowColor: theme.colors.accent,
              },
            ]}>
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </View>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalOverlay,
              {backgroundColor: theme.colors.overlay},
            ]}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Новая задача
              </Text>
              <TextInput
                placeholder="Текст задачи"
                placeholderTextColor={theme.colors.muted}
                value={taskText}
                onChangeText={text => {
                  setError(null);
                  setTaskText(text);
                }}
                multiline
                style={[
                  styles.input,
                  styles.inputMultiline,
                  {
                    backgroundColor: theme.colors.input,
                    color: theme.colors.text,
                  },
                ]}
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    resetTaskForm();
                    setModalVisible(false);
                  }}
                  style={({pressed}) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.border
                        : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text style={[styles.secondaryText, {color: theme.colors.text}]}>
                    Отмена
                  </Text>
                </Pressable>
                <Pressable
                  disabled={saving}
                  onPress={handleCreateTask}
                  style={({pressed}) => [
                    styles.primaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.accentMuted
                        : theme.colors.accent,
                      opacity: saving ? 0.7 : 1,
                    },
                  ]}>
                  <Text style={styles.primaryText}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={workspaceModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setWorkspaceModalVisible(false)}>
          <View
            style={[
              styles.modalOverlay,
              {backgroundColor: theme.colors.overlay},
            ]}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Новое пространство
              </Text>
              <TextInput
                placeholder="Название"
                placeholderTextColor={theme.colors.muted}
                value={workspaceName}
                onChangeText={text => {
                  setError(null);
                  setWorkspaceName(text);
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input,
                    color: theme.colors.text,
                  },
                ]}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setWorkspaceModalVisible(false);
                    setWorkspaceName('');
                  }}
                  style={({pressed}) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.border
                        : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text style={[styles.secondaryText, {color: theme.colors.text}]}>
                    Отмена
                  </Text>
                </Pressable>
                <Pressable
                  disabled={workspaceSaving}
                  onPress={handleCreateWorkspace}
                  style={({pressed}) => [
                    styles.primaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.accentMuted
                        : theme.colors.accent,
                      opacity: workspaceSaving ? 0.7 : 1,
                    },
                  ]}>
                  <Text style={styles.primaryText}>
                    {workspaceSaving ? 'Сохранение...' : 'Создать'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={renameModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setRenameModalVisible(false)}>
          <View
            style={[
              styles.modalOverlay,
              {backgroundColor: theme.colors.overlay},
            ]}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Переименовать пространство
              </Text>
              <TextInput
                placeholder="Новое название"
                placeholderTextColor={theme.colors.muted}
                value={renameValue}
                onChangeText={text => {
                  setError(null);
                  setRenameValue(text);
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input,
                    color: theme.colors.text,
                  },
                ]}
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setRenameModalVisible(false);
                    setRenameValue('');
                  }}
                  style={({pressed}) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.border
                        : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text style={[styles.secondaryText, {color: theme.colors.text}]}>
                    Отмена
                  </Text>
                </Pressable>
                <Pressable
                  disabled={workspaceSaving}
                  onPress={handleRenameWorkspace}
                  style={({pressed}) => [
                    styles.primaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.accentMuted
                        : theme.colors.accent,
                      opacity: workspaceSaving ? 0.7 : 1,
                    },
                  ]}>
                  <Text style={styles.primaryText}>
                    {workspaceSaving ? 'Сохранение...' : 'Сохранить'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 20,
    color: '#0B1224',
    fontWeight: '800',
  },
  workspaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  workspaceList: {
    gap: 10,
    paddingVertical: 6,
  },
  workspacePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  workspaceText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  linkButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  linkButtonText: {
    color: '#0B1224',
    fontWeight: '800',
  },
  renameButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  renameText: {
    fontWeight: '700',
  },
  segmentWrapper: {
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    marginBottom: 12,
  },
  error: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0B1224',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryText: {
    fontWeight: '700',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: {
    fontWeight: '800',
    color: '#0B1224',
  },
});

export default App;
