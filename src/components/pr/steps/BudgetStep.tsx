import React, { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData, Budget, ApprovalStep } from '../../../types/pr.types';
import { MOCK_BUDGETS } from '../../../constants/mockData';
import { Wallet, PieChart, AlertTriangle, Check, User, Shield, Zap, ChevronRight, Plus } from 'lucide-react';
import {
  SingleSelect as BlendSingleSelect,
  Button as BlendButton,
  ButtonType as BlendButtonType,
  ButtonSize as BlendButtonSize,
} from '@juspay/blend-design-system';

const toSelectGroups = (budgets: Budget[]) => [
  {
    items: budgets.map((budget) => ({
      label: `${budget.name} (${budget.department})`,
      value: budget.id,
    })),
  },
];

export const BudgetStep: React.FC = () => {
  const { watch, setValue } = useFormContext<PRFormData>();
  const selectedBudget = watch('budget');
  const totalAmount = watch('totalAmount');
  const department = watch('department');
  const approvalChain = watch('approvalChain');

  const filteredBudgets = MOCK_BUDGETS.filter(b => b.department === department);
  const otherBudgets = MOCK_BUDGETS.filter(b => b.department !== department);

  const isOverBudget = selectedBudget && totalAmount > selectedBudget.availableBalance;

  // Auto-detect approval chain based on amount
  useEffect(() => {
    const chain: ApprovalStep[] = [];
    const baseId = Date.now().toString();

    // Always need Manager
    chain.push({
      id: `${baseId}-1`,
      role: 'Department Head',
      status: 'Pending',
      type: 'Sequential'
    });

    if (totalAmount > 100000) { // 1L
      chain.push({
        id: `${baseId}-2`,
        role: 'Finance Manager',
        status: 'Pending',
        type: 'Sequential'
      });
    }

    if (totalAmount > 200000) { // 2L
      chain.push({
        id: `${baseId}-3`,
        role: 'CEO',
        status: 'Pending',
        type: 'Sequential'
      });
    }

    // Only update if chain length changed or it's empty
    if (approvalChain.length === 0 || approvalChain.length !== chain.length) {
      setValue('approvalChain', chain);
    }
  }, [totalAmount, setValue]);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Budget Allocation</h2>
          <p className="text-sm text-zinc-500 mt-1">Select the budget code to fund this purchase.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              selected={selectedBudget?.id === budget.id}
              onClick={() => setValue('budget', budget)}
              totalAmount={totalAmount}
            />
          ))}
          {filteredBudgets.length === 0 && (
            <div className="col-span-2 p-6 border-2 border-dashed border-zinc-200 rounded-3xl text-center">
              <p className="text-sm text-zinc-500">No budgets found for {department} department.</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <BlendSingleSelect
            label="Other Available Budgets"
            placeholder="Select from all budgets..."
            items={toSelectGroups(otherBudgets)}
            selected={selectedBudget?.id || ''}
            onSelect={(value) => {
              const budget = MOCK_BUDGETS.find((entry) => entry.id === value);
              if (budget) setValue('budget', budget);
            }}
            fullWidth
          />
        </div>

        {isOverBudget && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4 items-start">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-900">Budget Warning</h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                This request exceeds the available balance of the selected budget. 
                An additional justification or budget transfer may be required.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Approval Chain</h2>
            <p className="text-sm text-zinc-500 mt-1">Auto-detected based on total amount and department.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full">
            <Zap className="w-3 h-3 text-zinc-600" />
            <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider">Smart Detection Active</span>
          </div>
        </div>

        <div className="relative space-y-4">
          {approvalChain.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 group">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  index === 0 ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-zinc-200 text-zinc-400'
                }`}>
                  {index === 0 ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < approvalChain.length - 1 && (
                  <div className="w-0.5 h-12 bg-zinc-100" />
                )}
              </div>
              <div className="flex-1 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-blue-200 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-50 rounded-xl">
                    <Shield className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{step.role}</div>
                    <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Level {index + 1} • {step.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BlendButton
                    buttonType={BlendButtonType.SECONDARY}
                    size={BlendButtonSize.SMALL}
                    text="Add"
                    leadingIcon={<Plus className="w-4 h-4" />}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BudgetCard: React.FC<{ budget: Budget; selected: boolean; onClick: () => void; totalAmount: number }> = ({ budget, selected, onClick, totalAmount }) => {
  const percentage = Math.min(100, (budget.availableBalance / budget.totalBudget) * 100);
  const isWarning = totalAmount > budget.availableBalance;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden ${
        selected
          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-100'
          : 'border-zinc-100 bg-white hover:border-zinc-200'
      }`}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${selected ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900">{budget.name}</div>
          <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{budget.id}</div>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Available Balance</div>
            <div className={`text-lg font-semibold ${isWarning ? 'text-amber-600' : 'text-zinc-900'}`}>
              ${budget.availableBalance.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Budget</div>
            <div className="text-sm font-bold text-zinc-600">${budget.totalBudget.toLocaleString()}</div>
          </div>
        </div>

        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isWarning ? 'bg-amber-500' : 'bg-blue-600'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </button>
  );
};
