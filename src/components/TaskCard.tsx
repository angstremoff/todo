import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Task} from '../types';
import {Theme} from '../theme';

interface Props {
  task: Task;
  theme: Theme;
  onToggleStatus: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export const TaskCard: React.FC<Props> = ({
  task,
  theme,
  onToggleStatus,
  onDelete,
}) => {
  const isDone = task.status === 'done';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}>
      <View style={styles.header}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isDone
                ? theme.colors.success
                : theme.colors.accentMuted,
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              {color: isDone ? '#0F172A' : '#0B1224'},
            ]}>
            {isDone ? 'Выполнено' : 'В работе'}
          </Text>
        </View>
        {onDelete ? (
          <Pressable
            onPress={() => onDelete(task)}
            style={({pressed}) => [
              styles.deleteButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: pressed
                  ? theme.colors.border
                  : 'transparent',
              },
            ]}>
            <Text style={[styles.deleteLabel, {color: theme.colors.muted}]}>
              Удалить
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={[styles.title, {color: theme.colors.text}]}>{task.text}</Text>
      <View style={styles.footer}>
        <Text style={[styles.date, {color: theme.colors.muted}]}>
          {formatDate(task)}
        </Text>
        <Pressable
          onPress={() => onToggleStatus(task)}
          style={({pressed}) => [
            styles.actionButton,
            {
              backgroundColor: pressed
                ? theme.colors.accentMuted
                : theme.colors.accent,
            },
          ]}>
          <Text style={styles.actionText}>
            {isDone ? 'Вернуть в работу' : 'Готово'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const formatDate = (task: Task) => {
  const date = new Date(task.completedAt || task.createdAt);
  const formatted = date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
  });

  return task.status === 'done'
    ? `Закрыто ${formatted}`
    : `Создано ${formatted}`;
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    color: '#0B1224',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
