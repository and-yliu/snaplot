import { View, Text, TouchableOpacity } from 'react-native';


interface NeoCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string; // Optional unit to display after the value (e.g., "sec")
}

export function NeoCounter({ label, value, onChange, min = 0, max = 100, step = 1, unit }: NeoCounterProps) {
  const isAtMin = value <= min;
  const isAtMax = value >= max;

  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  return (
    <View className="flex-row items-center justify-between w-full mb-4">
      <Text
        className="text-xl flex-1 text-neo-text"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {label}:
      </Text>
      <View className="w-[160px] h-[50px] relative">
        <View className="absolute top-[4px] left-[4px] -right-[4px] -bottom-[4px] bg-neo-shadow rounded-lg" />
        <View className="flex-row items-center justify-between w-full h-full bg-neo-card border-2 border-neo-border rounded-lg px-2">
          <TouchableOpacity
            onPress={handleDecrement}
            className="w-10 h-full items-center justify-center"
            disabled={isAtMin}
          >
            <Text
              className={`text-2xl text-center ${isAtMin ? 'text-[#CCCCCC] opacity-50' : 'text-neo-text'}`}
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              -
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-1">
            <Text
              className="text-xl text-neo-text"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {value}
            </Text>
            {unit && (
              <Text
                className="text-base text-neo-text opacity-70"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {unit}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleIncrement}
            className="w-10 h-full items-center justify-center"
            disabled={isAtMax}
          >
            <Text
              className={`text-2xl text-center ${isAtMax ? 'text-[#CCCCCC] opacity-50' : 'text-neo-text'}`}
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
