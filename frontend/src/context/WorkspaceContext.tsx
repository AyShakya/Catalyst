import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBrands, Brand } from '../services/brandService';

interface WorkspaceContextType {
  brands: Brand[];
  activeBrand: Brand | null;
  setActiveBrandId: (brandId: string) => void;
  loading: boolean;
  refreshBrands: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const getBrandIdFromPath = (path: string) => {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'workspace' && parts.length > 1) {
    const candidate = parts[1];
    const legacyRoutes = ['overview', 'strategist', 'campaigns', 'analytics'];
    if (!legacyRoutes.includes(candidate)) {
      return candidate;
    }
  }
  return null;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchBrandsAndValidate = async (selectBrandId?: string) => {
    try {
      const res = await getBrands();
      if (res.status === 'success') {
        const brandList = res.data || [];
        setBrands(brandList);

        if (brandList.length === 0) {
          setActiveBrand(null);
          localStorage.removeItem('catalyst_brand_id');
          // If we are not already on setup, landing page, or docx page, redirect to setup
          if (location.pathname !== '/' && location.pathname !== '/setup' && location.pathname !== '/docx') {
            navigate('/setup');
          }
          return;
        }

        // Determine which brand to select:
        // 1. Parameter selectBrandId
        // 2. Brand ID in the URL path
        // 3. Last saved brand ID from localStorage
        const urlBrandId = getBrandIdFromPath(location.pathname);
        const storedId = selectBrandId || urlBrandId || localStorage.getItem('catalyst_brand_id');
        const validBrand = brandList.find(b => b.id === storedId);

        if (validBrand) {
          setActiveBrand(validBrand);
          localStorage.setItem('catalyst_brand_id', validBrand.id);
        } else {
          // Stale/missing brand ID, default to first available
          const defaultBrand = brandList[0];
          setActiveBrand(defaultBrand);
          localStorage.setItem('catalyst_brand_id', defaultBrand.id);
        }
      }
    } catch (err) {
      console.error("Failed to sync workspace brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandsAndValidate();
  }, []);

  // Listen to path changes and sync the active brand accordingly
  useEffect(() => {
    if (loading || brands.length === 0) return;
    const urlBrandId = getBrandIdFromPath(location.pathname);
    if (urlBrandId && activeBrand && urlBrandId !== activeBrand.id) {
      const found = brands.find(b => b.id === urlBrandId);
      if (found) {
        setActiveBrand(found);
        localStorage.setItem('catalyst_brand_id', found.id);
      }
    }
  }, [location.pathname, brands, loading, activeBrand]);

  const setActiveBrandId = (brandId: string) => {
    const targetBrand = brands.find(b => b.id === brandId);
    if (targetBrand) {
      setActiveBrand(targetBrand);
      localStorage.setItem('catalyst_brand_id', targetBrand.id);
    }
  };

  const refreshBrands = async () => {
    await fetchBrandsAndValidate();
  };

  return (
    <WorkspaceContext.Provider value={{ brands, activeBrand, setActiveBrandId, loading, refreshBrands }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
