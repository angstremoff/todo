import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Theme} from '../theme';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  theme: Theme;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  theme,
}: Props<T>) {
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.card}]}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({pressed}) => [
              styles.item,
              {
                backgroundColor: selected
                  ? theme.colors.accent
                  : 'transparent',
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text
              style={[
                styles.label,
                {
                  color: selected ? '#0B1224' : theme.colors.text,
                  fontWeight: selected ? '700' : '500',
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  label: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
