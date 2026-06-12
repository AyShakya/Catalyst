import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrand, uploadData } from '../services/brandService';
import { fileToBase64 } from '../utils/fileUtils';

type SetupState = 'form' | 'processing' | 'error';

const BrandSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<SetupState>('form');
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const steps = [
    "Importing Customer Data",
    "Importing Order Data",
    "Generating Customer Metrics",
    "Building Business Insights",
    "Preparing Workspace"
  ];

  const onCustomerDrop = useCallback((acceptedFiles: File[]) => {
    setCustomerFile(acceptedFiles[0]);
  }, []);

  const onOrderDrop = useCallback((acceptedFiles: File[]) => {
    setOrderFile(acceptedFiles[0]);
  }, []);

  const { getRootProps: getCustomerProps, getInputProps: getCustomerInput, isDragActive: isCustomerActive } = useDropzone({
    onDrop: onCustomerDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const { getRootProps: getOrderProps, getInputProps: getOrderInput, isDragActive: isOrderActive } = useDropzone({
    onDrop: onOrderDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !customerFile || !orderFile) {
      setErrorMessage('Please fill in all required fields and upload both CSV files.');
      return;
    }

    setState('processing');
    
    try {
      // 1. Create Brand
      const brand = await createBrand(brandName, industry);
      
      // Progress simulation start
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 1500);

      // 2. Convert to Base64
      const customerBase64 = await fileToBase64(customerFile);
      const orderBase64 = await fileToBase64(orderFile);

      // 3. Upload Data
      await uploadData(brand.id, customerBase64, orderBase64);

      // Store brand ID for workspace
      localStorage.setItem('catalyst_brand_id', brand.id);
      
      clearInterval(interval);
      setCurrentStep(steps.length - 1);
      
      // Final delay for UX
      setTimeout(() => {
        navigate('/workspace');
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setState('error');
      setErrorMessage(err.response?.data?.error || 'An error occurred during setup. Please try again.');
    }
  };

  if (state === 'processing') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2 uppercase">Building Your Workspace</h2>
            <p className="text-secondary">Catalyst is processing your brand data...</p>
          </motion.div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: index <= currentStep ? 1 : 0.3,
                  x: 0,
                  color: index === currentStep ? '#4f46e5' : '#111111'
                }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card-bg"
              >
                {index < currentStep ? (
                  <CheckCircle2 className="text-success" size={20} />
                ) : index === currentStep ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border" />
                )}
                <span className="font-bold text-sm uppercase tracking-wide">{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card-bg py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-secondary hover:text-foreground transition-colors mb-8 font-bold uppercase text-xs tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="bg-white p-10 rounded-3xl border border-border shadow-xl">
          <div className="mb-10">
            <h1 className="text-4xl font-black mb-4">SETUP BRAND</h1>
            <p className="text-secondary leading-relaxed">
              Create your intelligence workspace by uploading your customer and transaction history.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-secondary">Brand Name *</label>
                <input 
                  type="text" 
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-medium"
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-secondary">Industry</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-medium"
                  placeholder="e.g. Retail"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-secondary">Data Ingestion *</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  {...getCustomerProps()} 
                  className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isCustomerActive ? 'border-accent bg-accent/5' : customerFile ? 'border-success bg-success/5' : 'border-border hover:border-accent'
                  }`}
                >
                  <input {...getCustomerInput()} />
                  <UploadCloud className={`mb-4 ${customerFile ? 'text-success' : 'text-secondary'}`} size={32} />
                  <p className="text-sm font-bold uppercase tracking-wide mb-1">
                    {customerFile ? 'Customer CSV Selected' : 'Customers CSV'}
                  </p>
                  <p className="text-xs text-secondary italic">
                    {customerFile ? customerFile.name : 'Drop file or click to browse'}
                  </p>
                </div>

                <div 
                  {...getOrderProps()} 
                  className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isOrderActive ? 'border-accent bg-accent/5' : orderFile ? 'border-success bg-success/5' : 'border-border hover:border-accent'
                  }`}
                >
                  <input {...getOrderInput()} />
                  <UploadCloud className={`mb-4 ${orderFile ? 'text-success' : 'text-secondary'}`} size={32} />
                  <p className="text-sm font-bold uppercase tracking-wide mb-1">
                    {orderFile ? 'Orders CSV Selected' : 'Orders CSV'}
                  </p>
                  <p className="text-xs text-secondary italic">
                    {orderFile ? orderFile.name : 'Drop file or click to browse'}
                  </p>
                </div>
              </div>
            </div>

            {state === 'error' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm font-medium"
              >
                {errorMessage}
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full btn btn-primary py-4 text-lg"
            >
              Build Workspace
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandSetupPage;
