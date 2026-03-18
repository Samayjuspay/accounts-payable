import React, { useState } from 'react';
import { X, Building2, Package, DollarSign, Calendar, AlertCircle, CheckCircle, Plus, Trash2, FileText } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import EditableField from './EditableField';
import { getConfidenceColor } from '../../types/documentParsing.types';
import { toast } from 'sonner';

const ExtractionPreviewModal = ({ isOpen, onClose, extractedData, onApply }) => {
  const [localData, setLocalData] = useState(extractedData);
  const [lineItems, setLineItems] = useState(extractedData.items || []);

  if (!isOpen) return null;

  const handleVendorChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      vendor: { ...prev.vendor, [field]: value }
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...lineItems];
    updatedItems[index][field] = value;
    setLineItems(updatedItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        confidence: 0
      }
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return Math.round(subtotal * 0.2);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleApply = () => {
    const updatedData = {
      ...localData,
      items: lineItems
    };
    onApply(updatedData);
    onClose();
  };

  const getOverallConfidenceColor = () => {
    if (localData.overallConfidence >= 80) return 'green';
    if (localData.overallConfidence >= 60) return 'yellow';
    return 'red';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Review Extracted Data</h2>
              <p className="text-sm text-gray-600">AI extracted the following information. Review and edit if needed.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {localData.overallConfidence < 60 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">⚠️ Low confidence extraction</p>
                <p className="text-sm text-yellow-700 mt-1">Please review all fields carefully before applying.</p>
              </div>
            </div>
          )}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Vendor Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField
                label="Vendor Name"
                value={localData.vendor.name}
                onChange={(value) => handleVendorChange('name', value)}
                confidence={localData.confidence.vendorName}
              />
              <EditableField
                label="Contact Person"
                value={localData.vendor.contactPerson}
                onChange={(value) => handleVendorChange('contactPerson', value)}
                confidence={localData.confidence.contactPerson}
              />
              <EditableField
                label="Email"
                type="email"
                value={localData.vendor.email}
                onChange={(value) => handleVendorChange('email', value)}
                confidence={localData.confidence.email}
              />
              <EditableField
                label="Phone"
                value={localData.vendor.phone}
                onChange={(value) => handleVendorChange('phone', value)}
                confidence={localData.confidence.phone}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border-0 bg-transparent focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border-0 bg-transparent focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border-0 bg-transparent focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBadge score={item.confidence} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeLineItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addLineItem}
                className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  ₹{calculateSubtotal().toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Tax (20%)</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  ₹{calculateTax().toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  ₹{calculateTotal().toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Dates & Terms</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EditableField
                label="Quote Valid Until"
                type="date"
                value={localData.validUntil}
                onChange={(value) => setLocalData(prev => ({ ...prev, validUntil: value }))}
                confidence={localData.confidence.validUntil}
              />
              <EditableField
                label="Payment Terms"
                value={localData.paymentTerms}
                onChange={(value) => setLocalData(prev => ({ ...prev, paymentTerms: value }))}
                confidence={localData.confidence.paymentTerms}
              />
              <EditableField
                label="Delivery Time"
                value={localData.deliveryTime}
                onChange={(value) => setLocalData(prev => ({ ...prev, deliveryTime: value }))}
                confidence={localData.confidence.deliveryTime}
              />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Confidence Summary</h3>
              </div>
              <ConfidenceBadge score={localData.overallConfidence} size="md" />
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Confidence</span>
                <span className="text-sm font-medium text-gray-900">{localData.overallConfidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    getOverallConfidenceColor() === 'green' ? 'bg-green-500' :
                    getOverallConfidenceColor() === 'yellow' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${localData.overallConfidence}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Fields with low confidence are highlighted. Please review.
              </p>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Apply to Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtractionPreviewModal;