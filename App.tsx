import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  Share,
} from 'react-native';
import {SegmentedControl} from './src/components/SegmentedControl';
import {TaskCard} from './src/components/TaskCard';
import {EmptyState} from './src/components/EmptyState';
import {
  createTask,
  createWorkspace,
  deleteTask,
  exportData,
  importData,
  getTasks,
  getWorkspaces,
  renameWorkspace,
  deleteWorkspace,
  updateTaskText,
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
  const [confirmDeleteWs, setConfirmDeleteWs] = useState(false);
  const [menuWorkspace, setMenuWorkspace] = useState<Workspace | null>(null);
  const [taskMenuTask, setTaskMenuTask] = useState<Task | null>(null);
  const [taskEditVisible, setTaskEditVisible] = useState(false);
  const [taskEditText, setTaskEditText] = useState('');
  const [taskDeleteConfirm, setTaskDeleteConfirm] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [exportText, setExportText] = useState('');
  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [transfering, setTransfering] = useState(false);
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

  const ensureSelection = useCallback(
    (list: Workspace[]) => {
      if (list.length === 0) {
        setSelectedWorkspaceId(null);
      } else if (
        !selectedWorkspaceId ||
        !list.some(w => w.id === selectedWorkspaceId)
      ) {
        setSelectedWorkspaceId(list[0].id);
      }
    },
    [selectedWorkspaceId],
  );

  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
      ensureSelection(data);
    } catch (e) {
      setError('Не удалось загрузить пространства');
    }
  }, [ensureSelection]);

  const loadTasks = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getTasks(selectedWorkspaceId, undefined);
      setTasks(data);
    } catch (e) {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspaceId]);

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

  const handleOpenTaskMenu = (task: Task) => {
    setTaskMenuTask(task);
    setTaskEditText(task.text);
    setTaskEditVisible(false);
    setTaskDeleteConfirm(false);
  };

  const handleSaveTaskEdit = async () => {
    if (!taskMenuTask || !taskEditText.trim()) {
      setError('Введите текст задачи');
      return;
    }
    try {
      setSaving(true);
      await updateTaskText(taskMenuTask.id, taskEditText.trim());
      setTaskEditVisible(false);
      setTaskMenuTask(null);
      await loadTasks();
    } catch (e) {
      setError('Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskMenuTask) {
      return;
    }
    setTaskDeleteConfirm(false);
    await handleDelete(taskMenuTask);
    setTaskMenuTask(null);
  };

  const handleExport = async () => {
    try {
      setTransfering(true);
      const data = await exportData();
      const json = JSON.stringify(data);
      setExportText(json);
      setExportVisible(true);
    } catch (e) {
      setError('Не удалось экспортировать данные');
    } finally {
      setTransfering(false);
    }
  };

  const handleShareExport = async () => {
    if (!exportText) {
      return;
    }
    try {
      await Share.share({message: exportText});
    } catch (e) {
      setError('Не удалось поделиться экспортом');
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Вставьте данные для импорта');
      return;
    }
    try {
      setTransfering(true);
      const parsed = JSON.parse(importText);
      await importData(parsed, importMode);
      setImportVisible(false);
      setImportText('');
      await loadWorkspaces();
      await loadTasks();
    } catch (e) {
      setError('Импорт не удался. Проверьте формат.');
    } finally {
      setTransfering(false);
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
      setWorkspaces(prev => {
        const next = [...prev, ws];
        ensureSelection(next);
        return next;
      });
    } catch (e) {
      setError('Не удалось создать пространство');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleRenameWorkspace = async () => {
    if (!renameValue.trim() || !menuWorkspace) {
      setError('Введите новое имя');
      return;
    }
    try {
      setWorkspaceSaving(true);
      await renameWorkspace(menuWorkspace.id, renameValue.trim());
      setWorkspaces(prev => {
        const next = prev.map(w =>
          w.id === menuWorkspace.id ? {...w, name: renameValue.trim()} : w,
        );
        ensureSelection(next);
        return next;
      });
      setRenameModalVisible(false);
      setMenuWorkspace(null);
    } catch (e) {
      setError('Не удалось переименовать пространство');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!menuWorkspace) {
      return;
    }
    try {
      setWorkspaceSaving(true);
      await deleteWorkspace(menuWorkspace.id);
      const nextSpaces = workspaces.filter(w => w.id !== menuWorkspace.id);
      setWorkspaces(nextSpaces);
      ensureSelection(nextSpaces);
      setConfirmDeleteWs(false);
      setRenameModalVisible(false);
      setMenuWorkspace(null);
      await loadTasks();
    } catch (e) {
      setError('Не удалось удалить пространство');
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const renderTask = ({item}: {item: Task}) => (
    <TaskCard
      task={item}
      theme={theme}
      onToggleStatus={handleToggleStatus}
      onMenu={handleOpenTaskMenu}
    />
  );

  const listEmpty = (
    <EmptyState
      title={
        activeTab === 'done'
          ? 'Архив чист — круто!'
          : 'Здесь пока пусто'
      }
      subtitle={
        activeTab === 'done'
          ? 'Выполненные задачи появятся здесь.'
          : 'Добавьте первую задачу в выбранное пространство.'
      }
      actionLabel={activeTab !== 'done' ? 'Добавить' : undefined}
      onAction={
        activeTab !== 'done' ? () => setModalVisible(true) : undefined
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
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleExport}
                disabled={transfering}
                style={({pressed}) => [
                  styles.smallAction,
                  {
                    backgroundColor: pressed
                      ? theme.colors.border
                      : theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: transfering ? 0.6 : 1,
                  },
                ]}>
                <Text style={[styles.smallActionText, {color: theme.colors.text}]}>
                  Экспорт
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setError(null);
                  setImportVisible(true);
                }}
                style={({pressed}) => [
                  styles.smallAction,
                  {
                    backgroundColor: pressed
                      ? theme.colors.border
                      : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Text style={[styles.smallActionText, {color: theme.colors.text}]}>
                  Импорт
                </Text>
              </Pressable>
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
          </View>

          {workspaces.length === 0 ? (
            <View style={{marginBottom: 12}}>
              <EmptyState
                title="Нет пространств"
                subtitle="Создайте первое, чтобы добавлять задачи."
                actionLabel="Создать"
                onAction={() => setWorkspaceModalVisible(true)}
                theme={theme}
              />
            </View>
          ) : (
            <View style={styles.workspaceListWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.workspaceList}>
                {workspaces.map(space => {
                  const selected = space.id === selectedWorkspaceId;
                  const openMenu = (e?: GestureResponderEvent) => {
                    e?.stopPropagation();
                    setMenuWorkspace(space);
                    setRenameValue(space.name);
                  };
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
                          opacity: pressed ? 0.9 : 1,
                        },
                      ]}>
                      <View style={styles.workspaceContent}>
                        <Text
                          style={[
                            styles.workspaceText,
                            {color: selected ? '#0B1224' : theme.colors.text},
                          ]}
                          numberOfLines={1}>
                          {space.name}
                        </Text>
                        <Pressable
                          onPress={openMenu}
                          hitSlop={10}
                          style={({pressed}) => [
                            styles.workspaceMenuBtn,
                            {
                              backgroundColor: pressed
                                ? theme.colors.border
                                : 'transparent',
                            },
                          ]}>
                          <Text
                            style={{
                              color: selected ? '#0B1224' : theme.colors.muted,
                            }}>
                            ⋯
                          </Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

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
                {label: 'Все', value: 'all'},
                {label: 'Текущие', value: 'active'},
                {label: 'Архив', value: 'done'},
              ]}
              value={activeTab}
              onChange={value => setActiveTab(value as TabKey)}
              theme={theme}
            />
          </View>

          {error ? (
            <Text style={[styles.error, {color: theme.colors.danger}]}>
              {error}
            </Text>
          ) : null}

          <View style={{flex: 1}}>
            <FlatList
              data={tasks.filter(t =>
                activeTab === 'active'
                  ? t.status === 'active'
                  : activeTab === 'done'
                  ? t.status === 'done'
                  : true,
              )}
              keyExtractor={item => item.id.toString()}
              renderItem={renderTask}
              contentContainerStyle={[styles.listContent, {paddingBottom: 120}]}
              ItemSeparatorComponent={() => <View style={{height: 12}} />}
              ListEmptyComponent={listEmpty}
              showsVerticalScrollIndicator={false}
            />
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={theme.colors.accent} />
              </View>
            ) : null}
          </View>

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
          visible={exportVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setExportVisible(false)}>
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
                Экспорт
              </Text>
              <Text style={{color: theme.colors.muted}}>
                Данные для переноса. Можно поделиться или скопировать.
              </Text>
              <TextInput
                value={exportText}
                editable={false}
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
                  onPress={() => setExportVisible(false)}
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
                    Закрыть
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShareExport}
                  style={({pressed}) => [
                    styles.primaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.accentMuted
                        : theme.colors.accent,
                    },
                  ]}>
                  <Text style={styles.primaryText}>Поделиться</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={importVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setImportVisible(false)}>
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
                Импорт
              </Text>
              <View style={styles.importModeRow}>
                <Pressable
                  onPress={() => setImportMode('merge')}
                  style={({pressed}) => [
                    styles.smallAction,
                    {
                      backgroundColor:
                        importMode === 'merge'
                          ? theme.colors.accent
                          : pressed
                          ? theme.colors.border
                          : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.smallActionText,
                      {color: importMode === 'merge' ? '#0B1224' : theme.colors.text},
                    ]}>
                    Добавить
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setImportMode('replace')}
                  style={({pressed}) => [
                    styles.smallAction,
                    {
                      backgroundColor:
                        importMode === 'replace'
                          ? theme.colors.accent
                          : pressed
                          ? theme.colors.border
                          : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.smallActionText,
                      {color: importMode === 'replace' ? '#0B1224' : theme.colors.text},
                    ]}>
                    Заменить
                  </Text>
                </Pressable>
              </View>
              <Text style={{color: theme.colors.muted}}>
                Вставьте экспортированный JSON и примените.
              </Text>
              <TextInput
                placeholder="Вставьте данные"
                placeholderTextColor={theme.colors.muted}
                value={importText}
                onChangeText={text => {
                  setError(null);
                  setImportText(text);
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
                    setImportVisible(false);
                    setImportText('');
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
                  disabled={transfering}
                  onPress={handleImport}
                  style={({pressed}) => [
                    styles.primaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.accentMuted
                        : theme.colors.accent,
                      opacity: transfering ? 0.7 : 1,
                    },
                  ]}>
                  <Text style={styles.primaryText}>
                    {transfering ? 'Импорт...' : 'Импортировать'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={!!taskMenuTask && !taskEditVisible && !taskDeleteConfirm}
          animationType="fade"
          transparent
          onRequestClose={() => setTaskMenuTask(null)}>
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
                Задача
              </Text>
              <View style={{gap: 10}}>
                <Pressable
                  onPress={() => setTaskEditVisible(true)}
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
                    Редактировать
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTaskDeleteConfirm(true)}
                  style={({pressed}) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.border
                        : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text style={[styles.secondaryText, {color: theme.colors.danger}]}>
                    Удалить
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setTaskMenuTask(null)}
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
                    Закрыть
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={taskEditVisible}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setTaskEditVisible(false);
            setTaskMenuTask(null);
          }}>
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
                Редактировать задачу
              </Text>
              <TextInput
                placeholder="Текст задачи"
                placeholderTextColor={theme.colors.muted}
                value={taskEditText}
                onChangeText={text => {
                  setError(null);
                  setTaskEditText(text);
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
                    setTaskEditVisible(false);
                    setTaskMenuTask(null);
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
                  onPress={handleSaveTaskEdit}
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
          visible={taskDeleteConfirm}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setTaskDeleteConfirm(false);
            setTaskMenuTask(null);
          }}>
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
                Удалить задачу?
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setTaskDeleteConfirm(false);
                    setTaskMenuTask(null);
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
                  onPress={handleConfirmDeleteTask}
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
                    {saving ? 'Удаление...' : 'Удалить'}
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
          visible={!!menuWorkspace && !renameModalVisible && !confirmDeleteWs}
          animationType="fade"
          transparent
          onRequestClose={() => setMenuWorkspace(null)}>
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
                {menuWorkspace?.name || 'Пространство'}
              </Text>
              <View style={{gap: 10}}>
                <Pressable
                  onPress={() => {
                    setRenameModalVisible(true);
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
                    Переименовать
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirmDeleteWs(true)}
                  style={({pressed}) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: pressed
                        ? theme.colors.border
                        : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}>
                  <Text style={[styles.secondaryText, {color: theme.colors.danger}]}>
                    Удалить
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMenuWorkspace(null)}
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
                    Закрыть
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
          onRequestClose={() => {
            setRenameModalVisible(false);
            setRenameValue('');
            setMenuWorkspace(null);
          }}>
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
                    setMenuWorkspace(null);
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

        <Modal
          visible={confirmDeleteWs}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setConfirmDeleteWs(false);
            setMenuWorkspace(null);
          }}>
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
                Удалить пространство?
              </Text>
              <Text style={{color: theme.colors.muted}}>
                Все задачи внутри тоже будут удалены.
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => {
                    setConfirmDeleteWs(false);
                    setMenuWorkspace(null);
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
                  onPress={handleDeleteWorkspace}
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
                    {workspaceSaving ? 'Удаление...' : 'Удалить'}
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
    marginBottom: 4,
  },
  themeToggle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleText: {
    fontSize: 16,
    color: '#0B1224',
    fontWeight: '800',
  },
  workspaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  workspaceListWrapper: {
    paddingVertical: 2,
    marginBottom: 8,
  },
  workspaceList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workspacePill: {
    paddingHorizontal: 12,
    height: 42,
    minWidth: 140,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  workspaceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workspaceText: {
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  workspaceMenuBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
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
  workspaceActions: {
    flexDirection: 'row',
    gap: 8,
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
  listContent: {
    gap: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallAction: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  smallActionText: {
    fontWeight: '700',
    fontSize: 12,
  },
  importModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});

export default App;
