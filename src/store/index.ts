import { configureStore } from '@reduxjs/toolkit';
import type { Action, ThunkAction } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for Date objects
        ignoredActions: ['filters/setDateRange'],
        ignoredPaths: ['filters.startDate', 'filters.endDate'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production' && {
    name: 'Money Tracking App',
    trace: true,
    traceLimit: 25,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

