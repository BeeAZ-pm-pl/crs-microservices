import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { getApiKeys, createApiKey, revokeApiKey } from '../api/apiKeyApi';
import type { ApiKey } from '../types/apiKey';
import type { ApiErrorResponse } from '../types/apiError';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [scopes, setScopes] = useState('courses:read');
  const [validDays, setValidDays] = useState('30');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(() => {
    setLoading(true);
    getApiKeys()
      .then((res) => setKeys(res.data))
      .catch(() => setError('Không tải được danh sách API Key.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNewKeyValue(null);
    try {
      const res = await createApiKey({
        ownerName,
        scopes,
        validDays: validDays ? Number(validDays) : undefined,
      });
      setNewKeyValue(res.data.keyValue);
      setOwnerName('');
      loadKeys();
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Cấp API Key không thành công.');
      }
    }
  };

  const handleRevoke = async (key: ApiKey) => {
    if (!window.confirm(`Thu hồi API Key của "${key.ownerName}"?`)) return;
    try {
      await revokeApiKey(key.id);
      loadKeys();
    } catch {
      alert('Thu hồi không thành công.');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>Quản lý API Key đối tác</h1>
      <form onSubmit={handleCreate} style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h3>Cấp API Key mới</h3>
        <div style={{ marginBottom: 8 }}>
          <label>Tên đối tác</label><br />
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Scopes (cách nhau bởi dấu phẩy)</label><br />
          <input value={scopes} onChange={(e) => setScopes(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Hiệu lực (số ngày, để trống = vĩnh viễn)</label><br />
          <input type="number" value={validDays} onChange={(e) => setValidDays(e.target.value)} />
        </div>
        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
        <button type="submit">Cấp API Key</button>
      </form>

      {newKeyValue && (
        <div style={{ background: '#fef9c3', padding: 12, borderRadius: 8, marginBottom: 24 }}>
          <strong>Key vừa tạo (chỉ hiển thị 1 lần, hãy lưu lại ngay):</strong>
          <pre style={{ userSelect: 'all' }}>{newKeyValue}</pre>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
              <th>Đối tác</th>
              <th>Scopes</th>
              <th>Trạng thái</th>
              <th>Hết hạn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{k.ownerName}</td>
                <td>{k.scopes}</td>
                <td style={{ color: k.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>{k.status}</td>
                <td>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}</td>
                <td>
                  {k.status === 'ACTIVE' && (
                    <button onClick={() => handleRevoke(k)}>Thu hồi</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
