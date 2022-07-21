import { useNavigation, useRoute } from '@react-navigation/native';
import { VStack, Text, HStack, useTheme, ScrollView } from 'native-base';
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';

import { CircleWavyCheck, Hourglass, DesktopTower, ClipboardText } from 'phosphor-react-native';

import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { OrderFirestoreDTO } from '../DTOs/OrderDTO';
import { dateFormat } from '../utils/firestoreDateFormat';
import { Loading } from '../components/Loading';
import { CardDetails } from '../components/CardDetails';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from 'react-native';

type RouteParams = {
  orderId: string;
}

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {

  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params as RouteParams;
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);
  const [isLoading, setIsLoading] = useState(true);
  const [solution, setSolution] = useState('');
  const { colors } = useTheme();

  function handleOrderClosed() {
    if (!solution) {
      return Alert.alert('Solicitação', 'Informe a solução para encerrar a solicitação');
    }

    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .update({
        status: 'closed',
        solution,
        closedAt: firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        Alert.alert('Solicitação', 'Solicitação encerrada.');
        navigation.goBack();
      })
      .catch((error) => {
        console.log(error);
        Alert.alert('Solicitação', 'Não foi possível encerrar a solicitação.');
      });
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const { patrimony, description, status, createdAt, closedAt, solution } = doc.data();

        const closed = closedAt ? dateFormat(closedAt) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(createdAt),
          closed
        });

        setIsLoading(false);
      })

  }, []);

  if (isLoading) {
    return <Loading />
  }

  return (
    <VStack flex={1} bg="gray.700">
      <Header title="solicitação" />

      <HStack bg='gray.500' justifyContent='center' p={4}>
        {
          order.status === 'closed'
            ? <CircleWavyCheck size={22} color={colors.green[300]} />
            : <Hourglass size={22} color={colors.secondary[700]} />
        }

        <Text
          fontSize='sm'
          color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
          ml={2}
          textTransform='uppercase'
        >
          {order.status === 'closed' ? 'finalizado' : 'em andamento'}
        </Text>
      </HStack>

      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
        <CardDetails
          title="equipamento"
          description={`Patrimônio ${order.patrimony}`}
          icon={DesktopTower}
        />

        <CardDetails
          title="descrição do problema"
          description={order.description}
          icon={ClipboardText}
          footer={`Registrado em ${order.when}`}
        />

        <CardDetails
          title="solução"
          icon={CircleWavyCheck}
          description={order.solution}
          footer={order.closed && `Encerrado em ${order.closed}`}
        >
          {
            order.status === 'open' &&
            <Input
              placeholder='Descrição da solução'
              onChangeText={setSolution}
              textAlignVertical="top"
              multiline
              h={24}
            />}
        </CardDetails>

      </ScrollView>

      {
        order.status === 'open' &&
        <Button
          title='Encerrar solicitação'
          onPress={handleOrderClosed}
          m={5}
        />
      }

    </VStack>
  );
}