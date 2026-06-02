import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, QrCode, Clock, Trash2, RefreshCw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PageTransition from '@/components/PageTransition';

const generateToken = (): string => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
};

const AdminQRGenerator = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [generatedQR, setGeneratedQR] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [existingQRs, setExistingQRs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    fetchExistingQRs();
  }, []);

  const fetchExistingQRs = async () => {
    const { data, error } = await supabase
      .from('generated_qr_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExistingQRs(data);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!studentName.trim() || !grade || !section.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all fields.',
      });
      return;
    }

    setGenerating(true);

    try {
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const qrRecord = {
        student_name: studentName.trim(),
        grade,
        section: section.trim(),
        qr_token: token,
        expires_at: expiresAt.toISOString(),
        created_by: user?.id || '',
      };

      const { data, error } = await supabase
        .from('generated_qr_codes')
        .insert([qrRecord])
        .select()
        .single();

      if (error) throw error;

      const qrData = JSON.stringify({
        type: 'admin_generated',
        token: token,
        student_name: studentName.trim(),
        section: section.trim(),
        grade,
        v: 3,
      });

      setGeneratedQR({ ...data, qrData });
      setStudentName('');
      setGrade('');
      setSection('');
      fetchExistingQRs();

      toast({
        title: 'QR Code Generated',
        description: `QR code for ${data.student_name} created. Valid for 1 week.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to generate QR code.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase
      .from('generated_qr_codes')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      toast({ title: 'QR Code Deactivated' });
      fetchExistingQRs();
      if (generatedQR?.id === id) setGeneratedQR(null);
    }
  };

  const downloadQR = (qrData: string, name: string) => {
    const svg = document.getElementById('generated-qr');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${name.replace(/\s+/g, '_')}_QR.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const getQRDataString = (qr: any) => {
    return JSON.stringify({
      type: 'admin_generated',
      token: qr.qr_token,
      student_name: qr.student_name,
      section: qr.section,
      grade: qr.grade,
      v: 3,
    });
  };

  if (userRole && userRole !== 'admin') return null;

  return (
    <PageTransition>
      <div className="min-h-screen gradient-bg p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" className="mb-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Generator Form */}
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <QrCode className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">Manual QR Generator</CardTitle>
                <CardDescription>
                  Generate QR codes for students without phones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    placeholder="e.g. Juan Dela Cruz"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    placeholder="e.g. St. Joseph"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>

            {/* Generated QR Preview */}
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">QR Code Preview</CardTitle>
                <CardDescription>
                  {generatedQR ? 'Download or print this QR code' : 'Generate a code to preview'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {generatedQR ? (
                  <>
                    <div className="bg-white p-6 rounded-lg shadow-inner">
                      <QRCodeSVG
                        id="generated-qr"
                        value={generatedQR.qrData || getQRDataString(generatedQR)}
                        size={220}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-lg font-semibold">{generatedQR.student_name}</p>
                      <p className="text-sm text-muted-foreground">{generatedQR.grade} — {generatedQR.section}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Expires: {format(new Date(generatedQR.expires_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <Button
                      onClick={() => downloadQR(getQRDataString(generatedQR), generatedQR.student_name)}
                      className="w-full max-w-xs"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <QrCode className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No QR code generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Existing Generated QR Codes */}
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Active Generated QR Codes</CardTitle>
              <CardDescription>All admin-generated QR codes that are still active</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                </div>
              ) : existingQRs.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No active QR codes</p>
              ) : (
                <div className="space-y-3">
                  {existingQRs.map((qr) => {
                    const isExpired = new Date(qr.expires_at) < new Date();
                    return (
                      <div
                        key={qr.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          isExpired ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{qr.student_name}</p>
                          <p className="text-sm text-muted-foreground">{qr.grade} — {qr.section}</p>
                          <p className={`text-xs mt-1 ${isExpired ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                            {isExpired ? 'Expired' : `Expires ${format(new Date(qr.expires_at), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setGeneratedQR({ ...qr, qrData: getQRDataString(qr) })}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeactivate(qr.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminQRGenerator;
