import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 48 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          styles.initial,
          {
            fontSize: size * 0.4,
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  placeholder: {
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    ...typography.h3,
    color: colors.primary[600],
    fontWeight: '600',
  },
});

export default Avatar;
