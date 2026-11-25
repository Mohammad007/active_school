import { StyleSheet, View } from 'react-native';

import { EmptyState, Header, Logo, Screen } from '@/components/ui';
import { goReplace } from '@/lib/nav';
import { homeRoute } from '@/stores/session';
import { Spacing } from '@/theme';

export default function NotFound() {
  return (
    <Screen>
      <Header back={false} border={false}>
        <Logo height={22} />
      </Header>
      <View style={styles.body}>
        <EmptyState
          art="students"
          title="Page not found"
          message="This link does not lead anywhere in ActiveSchool."
          actionLabel="Go home"
          onAction={() => goReplace(homeRoute() as string)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', paddingBottom: Spacing.xxxl },
});
