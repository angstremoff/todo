import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
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
import {createTask, deleteTask, getTasks, updateTaskStatus} from './src/db/tasks';
import {Task} from './src/types';
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
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setThemeMode(systemScheme === 'dark' ? 'dark' : 'light');
  }, [systemScheme]);

  const theme = useMemo(
    () => (themeMode === 'dark' ? darkTheme : lightTheme),
    [themeMode],
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks(activeTab === 'active' ? 'active' : 'done');
      setTasks(data);
    } catch (e) {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleTheme = () => {
    LayoutAnimation.easeInEaseOut();
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setError(null);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      setError('Введите название задачи');
      return;
    }
    try {
      setSaving(true);
      await createTask({title, description});
      resetForm();
      setModalVisible(false);
      if (activeTab !== 'active') {
        setActiveTab('active');
      } else {
        await loadTasks();
      }
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
          ? 'Добавьте первую задачу и держите прогресс под рукой.'
          : 'Выполненные задачи появятся здесь.'
      }
      actionLabel={activeTab === 'active' ? 'Добавить' : undefined}
      onAction={activeTab === 'active' ? () => setModalVisible(true) : undefined}
      theme={theme}
    />
  );

  return (
    <ThemeContext.Provider value={{theme, toggleTheme}}>
      <SafeAreaView
        style={[styles.safeArea, {backgroundColor: theme.colors.background}]}>
        <StatusBar
          barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
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

          <View
            style={[
              styles.segmentWrapper,
              {backgroundColor: theme.colors.card, borderColor: theme.colors.border},
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
              contentContainerStyle={[
                styles.listContent,
                {paddingBottom: 120},
              ]}
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
                placeholder="Заголовок"
                placeholderTextColor={theme.colors.muted}
                value={title}
                onChangeText={text => {
                  setError(null);
                  setTitle(text);
                }}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input,
                    color: theme.colors.text,
                  },
                ]}
              />
              <TextInput
                placeholder="Описание (необязательно)"
                placeholderTextColor={theme.colors.muted}
                value={description}
                onChangeText={setDescription}
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
                    resetForm();
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
    marginBottom: 12,
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
    minHeight: 100,
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
