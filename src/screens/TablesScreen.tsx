import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../design/tokens';
import { useSwipe } from '../context/SwipeContext';
import { Table } from '../utils/storage';

export default function TablesScreen({ onEnterTable }: { onEnterTable?: (table: Table) => void }) {
  const { tables, loadSavedData } = useSwipe();

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  if (tables.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tables yet</Text>
          <Text style={styles.emptyText}>
            Join tables by swiping right on restaurants
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tables</Text>
        <Text style={styles.subtitle}>{tables.length} tables</Text>
      </View>
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 80 }]}
        renderItem={({ item: table }) => {
          const photoUrl = table.restaurant.contextual_info?.photos?.[0]?.original_url || '';
          const cuisine = table.restaurant.categories[0]?.title || '';
          
          return (
            <TouchableOpacity
              style={styles.tableCard}
              onPress={() => onEnterTable?.(table)}
              activeOpacity={0.7}
            >
              {/* Restaurant Photo */}
              <View style={styles.imageContainer}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.placeholderImage]} />
                )}
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {table.restaurant.name}
                </Text>
                <Text style={styles.cuisine}>{cuisine}</Text>
                
                {/* Member Count */}
                <View style={styles.memberBadge}>
                  <Text style={styles.memberCount}>
                    {table.memberCount} {table.memberCount === 1 ? 'person' : 'people'} want this table
                  </Text>
                </View>

                {/* Time Intent Chips */}
                <View style={styles.timeIntentContainer}>
                  {table.timeIntent.tonight > 0 && (
                    <View style={styles.timeChip}>
                      <Text style={styles.timeChipText}>Tonight</Text>
                    </View>
                  )}
                  {table.timeIntent.thisWeek > 0 && (
                    <View style={styles.timeChip}>
                      <Text style={styles.timeChipText}>This week</Text>
                    </View>
                  )}
                  {table.timeIntent.weekend > 0 && (
                    <View style={styles.timeChip}>
                      <Text style={styles.timeChipText}>Weekend</Text>
                    </View>
                  )}
                </View>

                {/* Enter Table Button */}
                <TouchableOpacity style={styles.enterButton} activeOpacity={0.7}>
                  <Text style={styles.enterButtonText}>Enter Table</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    ...typography.title,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.meta,
    color: colors.gray600,
  },
  listContent: {
    padding: spacing.md,
  },
  tableCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 120,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: colors.gray200,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  restaurantName: {
    ...typography.subtitle,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  cuisine: {
    ...typography.meta,
    color: colors.gray600,
    marginBottom: spacing.xs,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent + '20',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  memberCount: {
    ...typography.small,
    color: colors.accent,
    fontWeight: '600',
  },
  timeIntentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  timeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  timeChipText: {
    ...typography.small,
    color: colors.gray700,
  },
  enterButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
  },
  enterButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.gray800,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray600,
    textAlign: 'center',
  },
});


