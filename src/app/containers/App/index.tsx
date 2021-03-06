import React, { useContext, useEffect } from 'react'
import style from './style.css'
import { Route, RouteComponentProps, Switch } from 'react-router'
import { useDispatch, useSelector } from 'react-redux'
import { useTodoActions } from 'app/actions'
import { RootState } from 'app/reducers'
import { TodoModel } from 'app/models'
import {FirebaseContext} from 'app/FirebaseContext';
import { Footer, Header, TodoList, StudentList, MyAppBar } from 'app/components'

const FILTER_VALUES = (Object.keys(TodoModel.Filter) as (keyof typeof TodoModel.Filter)[]).map(
  (key) => TodoModel.Filter[key]
);

const FILTER_FUNCTIONS: Record<TodoModel.Filter, (todo: TodoModel) => boolean> = {
  [TodoModel.Filter.SHOW_ALL]: () => true,
  [TodoModel.Filter.SHOW_ACTIVE]: (todo) => !todo.completed,
  [TodoModel.Filter.SHOW_COMPLETED]: (todo) => todo.completed
};

export namespace App {
  export interface Props extends RouteComponentProps<void> {}
}

export const App = ({ history, location }: App.Props) => {
  const firebaseContext = useContext(FirebaseContext);

  useEffect(() => {
    if (firebaseContext.app) {
      const db = firebaseContext.app.firestore();
      db.collection("students").get().then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
              console.log(doc.id, ' => ', doc.data());
          });
        });
    }
  }, [])

  const dispatch = useDispatch()
  const todoActions = useTodoActions(dispatch)
  const { todos, filter } = useSelector((state: RootState) => {
    const hash = location?.hash?.replace('#', '');
    return {
      todos: state.todos,
      filter: FILTER_VALUES.find((value) => value === hash) ?? TodoModel.Filter.SHOW_ALL
    };
  });

  const handleClearCompleted = React.useCallback((): void => {
    todoActions.clearCompleted();
  }, [todoActions]);

  const handleFilterChange = React.useCallback(
    (filter: TodoModel.Filter): void => {
      history.push(`#${filter}`);
    },
    [history]
  );

  const filteredTodos = React.useMemo(() => (filter ? todos.filter(FILTER_FUNCTIONS[filter]) : todos), [todos, filter]);
  const activeCount = React.useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);
  const completedCount = React.useMemo(() => todos.filter((todo) => todo.completed).length, [todos]);

  return (
    <div className={style.normal}>
      <MyAppBar/>
      <Switch>
        <Route path="/admin">
          <StudentList/>
        </Route>
        <Route path="/search">
          <Header addTodo={todoActions.addTodo} />
          <TodoList todos={filteredTodos} actions={todoActions} />
          <Footer
            filter={filter}
            activeCount={activeCount}
            completedCount={completedCount}
            onClickClearCompleted={handleClearCompleted}
            onClickFilter={handleFilterChange}
          />
        </Route>
        <Route path="/">
        </Route>
      </Switch>
    </div>
  );
};
