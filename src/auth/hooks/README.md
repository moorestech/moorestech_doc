# Auth Hooks Documentation

## Architecture Overview

新しい認証システムは以下の3層構造になっています：

1. **`useNetlifyAuth`** - 低レベルOAuth認証フロー
2. **`AuthContext`** - グローバル認証状態管理
3. **`useGitHubAuth`** - GitHub特化の高レベルAPI

## 使用例

### 基本的な認証フロー

```tsx
import React from 'react';
import { useGitHubAuth } from '@site/src/auth/hooks/useGitHubAuth';

function LoginButton() {
  const { isAuthenticated, userInfo, login, logout, isLoading } = useGitHubAuth({
    scope: 'repo, user:email',
    onSuccess: (user) => {
      console.log('Logged in:', user);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
  
  if (isLoading) {
    return <button disabled>Loading...</button>;
  }
  
  if (isAuthenticated) {
    return (
      <div>
        <img src={userInfo?.avatar_url} alt="" width={32} />
        <span>Hello, {userInfo?.name || userInfo?.login}</span>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return <button onClick={login}>Login with GitHub</button>;
}
```

### GitHub API操作

```tsx
import { useGitHubAuth } from '@site/src/auth/hooks/useGitHubAuth';

function FileEditor() {
  const { github, isAuthenticated } = useGitHubAuth();
  
  const updateFile = async () => {
    if (!isAuthenticated) return;
    
    try {
      // ファイル取得
      const file = await github.getFileContent('owner', 'repo', 'README.md');
      
      // 内容を更新
      const newContent = file.decodedContent + '\n\nUpdated!';
      
      // ファイル更新
      await github.updateFileContent(
        'owner',
        'repo',
        'README.md',
        newContent,
        'Update README',
        file.sha
      );
    } catch (error) {
      console.error('Failed to update file:', error);
    }
  };
  
  return <button onClick={updateFile}>Update File</button>;
}
```

### AuthProviderの設定

ルートコンポーネント（通常は`Root.tsx`）で`AuthProvider`をラップ：

```tsx
import React from 'react';
import { AuthProvider } from '@site/src/auth/contexts/AuthContext';

export default function Root({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
```

## 主な改善点

### 🎯 Before → After

1. **クラスベース → Hooks**
   - 以前: `new NetlifyAuthenticator()` 
   - 現在: `useNetlifyAuth()`

2. **分散した状態管理 → 統合Context**
   - 以前: 個別の関数でlocalStorage操作
   - 現在: `AuthContext`で一元管理

3. **エラーハンドリング**
   - 以前: try-catchの散在
   - 現在: Hook内で統一処理 + `onError`コールバック

4. **型安全性**
   - 以前: `any`型の多用
   - 現在: 完全な型定義

5. **リアクティブ更新**
   - 以前: 手動でのDOM更新
   - 現在: React状態による自動更新

6. **マルチタブ対応**
   - 以前: なし
   - 現在: storage eventでタブ間同期

## Migration Guide

既存コードからの移行：

```tsx
// Before
import { useGitHubAuth } from '@site/src/auth/github';

function Component() {
  const { login, isLoggedIn } = useGitHubAuth();
  
  const handleLogin = async () => {
    const data = await login();
    // 手動で状態管理
  };
}

// After  
import { useGitHubAuth } from '@site/src/auth/hooks/useGitHubAuth';

function Component() {
  const { login, isAuthenticated, userInfo } = useGitHubAuth();
  
  // 状態は自動管理される
  const handleLogin = () => login();
}
```

## TypeScript型定義

```ts
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (user: User) => void;
  logout: () => void;
  updateToken: (token: string) => void;
  clearError: () => void;
}

interface GitHubAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  userInfo: GitHubUserInfo | null;
  token: string | null;
  login: () => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  error: Error | null;
  github: {
    createRepo: (name: string, options?: any) => Promise<any>;
    getRepo: (owner: string, repo: string) => Promise<any>;
    getFileContent: (owner: string, repo: string, path: string) => Promise<any>;
    updateFileContent: (...args) => Promise<any>;
  };
}
```

## Best Practices

1. **AuthProviderは必須** - ルートレベルで必ず設定
2. **エラーハンドリング** - `onError`コールバックを活用
3. **ローディング状態** - `isLoading`で適切なUI表示
4. **スコープの指定** - 必要最小限の権限のみ要求
5. **トークンの直接操作を避ける** - Hook経由でアクセス