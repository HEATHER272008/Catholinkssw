import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Clock, UserPlus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface AdminRequest {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  birthday: string | null;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export const AdminRequestsManager = () => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests((data as AdminRequest[]) || []);
    } catch (error: any) {
      console.error('Error fetching admin requests:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load admin requests',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request: AdminRequest) => {
    setProcessingId(request.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No session available');
      }

      const { data, error } = await supabase.functions.invoke('approve-admin', {
        body: { requestId: request.id, action: 'approve' },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Request Approved',
        description: `Admin account created for ${request.name}`,
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to approve request',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessingId(selectedRequest.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error('No session available');
      }

      const { data, error } = await supabase.functions.invoke('approve-admin', {
        body: { 
          requestId: selectedRequest.id, 
          action: 'reject',
          rejectionReason 
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Request Rejected',
        description: `Admin request from ${selectedRequest.name} was rejected`,
      });

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reject request',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (request: AdminRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Requests
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingRequests.length}
            </Badge>
          )}
        </h3>
        
        {pendingRequests.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="py-8 text-center text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending admin requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{request.name}</span>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      {request.phone && (
                        <p className="text-sm text-muted-foreground">{request.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request)}
                        disabled={processingId === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRejectDialog(request)}
                        disabled={processingId === request.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Recent History</h3>
          <div className="space-y-2">
            {processedRequests.slice(0, 5).map((request) => (
              <Card key={request.id} className="bg-muted/20">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{request.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({request.email})</span>
                    </div>
                    <Badge 
                      variant={request.status === 'approved' ? 'default' : 'destructive'}
                      className={request.status === 'approved' ? 'bg-green-600' : ''}
                    >
                      {request.status === 'approved' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Approved
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Rejected
                        </>
                      )}
                    </Badge>
                  </div>
                  {request.rejection_reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {request.rejection_reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reject Admin Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the admin request from <strong>{selectedRequest?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {processingId ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
