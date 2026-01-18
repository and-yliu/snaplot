import { View, ViewProps } from 'react-native';

export function NeoView({ style, children, ...props }: ViewProps) {
  return (
    <View className="relative" style={style} {...props}>
      <View className="absolute top-[4px] left-[4px] -right-[4px] -bottom-[4px] bg-neo-shadow rounded-xl" />
      <View className="bg-neo-card rounded-xl border-2 border-neo-border p-4 overflow-hidden">
        {children}
      </View>
    </View>
  );
}
