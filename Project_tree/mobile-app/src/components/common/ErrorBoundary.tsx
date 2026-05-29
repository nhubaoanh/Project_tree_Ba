import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#F44336" />
          <Text variant="headlineSmall" style={styles.title}>
            Đã có lỗi xảy ra
          </Text>
          <Text variant="bodyMedium" style={styles.message}>
            Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
          </Text>
          {__DEV__ && this.state.error && (
            <Text variant="bodySmall" style={styles.errorDetails}>
              {this.state.error.toString()}
            </Text>
          )}
          <Button mode="contained" onPress={this.handleReset} style={styles.button}>
            Thử lại
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  errorDetails: {
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
  },
});
