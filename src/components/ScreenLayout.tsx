import React from 'react';
import { View, StyleSheet, StatusBar, StyleProp, ViewStyle, StatusBarStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme';

export interface ScreenLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  backgroundColor = colors.background,
  statusBarStyle = 'light-content',
  edges = ['top', 'left', 'right', 'bottom'],
  style,
  contentStyle,
}) => {
  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
