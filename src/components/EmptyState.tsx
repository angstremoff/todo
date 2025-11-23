import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Theme} from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: Theme;
}

export const EmptyState: React.FC<Props> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  theme,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
      ]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, {color: theme.colors.muted}]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({pressed}) => [
            styles.button,
            {
              backgroundColor: pressed
                ? theme.colors.accentMuted
                : theme.colors.accent,
            },
          ]}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#0B1224',
    fontWeight: '700',
  },
});
