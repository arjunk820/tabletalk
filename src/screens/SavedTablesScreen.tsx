import React from 'react';
import TablesScreen from './TablesScreen';
import { Table } from '../utils/storage';

interface SavedTablesScreenProps {
  onTablePress?: (table: Table) => void;
}

export default function SavedTablesScreen({ onTablePress }: SavedTablesScreenProps) {
  return <TablesScreen onEnterTable={onTablePress} />;
}
