{/* Filtros e pesquisa */}
  <Card>
    <CardContent className="pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por número, cliente, fornecedor ou etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <EncomendaStatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <Label htmlFor="show-completed">Mostrar entregues</Label>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Lista de encomendas */}
  <div className="space-y-4">
    {filteredEncomendas.length === 0 ? (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma encomenda encontrada</p>
        </CardContent>
      </Card>
    ) : (
      filteredEncomendas.map((encomenda) => (
        <Card key={encomenda.id} className="shadow-card transition-all duration-300 hover:shadow-hover">
          <CardContent className="p-6">
            {/* Primeira linha: Pedido, Etiqueta, Cliente, Fornecedor, Ações */}
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Pedido</div>
                  <div className="font-bold text-lg text-primary-dark">
                    #{encomenda.numero_encomenda}
                  </div>
                </div>
                
                {encomenda.etiqueta && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Etiqueta</div>
                    <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {encomenda.etiqueta}
                    </div>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Cliente</div>
                  <div className="text-sm font-semibold truncate">
                    {encomenda.clientes?.nome || 'N/A'}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Fornecedor</div>
                  <div className="text-sm font-medium text-muted-foreground truncate">
                    {encomenda.fornecedores?.nome || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => {
                    setSelectedEncomenda(encomenda);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => handlePrint(encomenda)}
                >
                  <Printer className="h-5 w-5" />
                </Button>
                {canEdit() && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => {
                        setSelectedEncomenda(encomenda);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <EncomendaActions
                      encomenda={encomenda}
                      onDelete={handleDelete}
                      onTransport={() => handleTransport(encomenda)}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Segunda linha: Dados detalhados com labels */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 items-start">
              {/* Data Produção */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Data Produção</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !encomenda.data_producao_estimada && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-sm">
                        {encomenda.data_producao_estimada ? (
                          formatDate(encomenda.data_producao_estimada)
                        ) : (
                          "Selecionar"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={encomenda.data_producao_estimada ? new Date(encomenda.data_producao_estimada) : undefined}
                      onSelect={(date) => {
                        const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                        handleDateUpdate(encomenda.id, 'data_producao_estimada', dateString);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Entrega */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Data Entrega</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !encomenda.data_envio_estimada && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="text-sm">
                        {encomenda.data_envio_estimada ? (
                          formatDate(encomenda.data_envio_estimada)
                        ) : (
                          "Selecionar"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={encomenda.data_envio_estimada ? new Date(encomenda.data_envio_estimada) : undefined}
                      onSelect={(date) => {
                        const dateString = date ? format(date, 'yyyy-MM-dd') : '';
                        handleDateUpdate(encomenda.id, 'data_envio_estimada', dateString);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Peso Bruto */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Peso Bruto</div>
                <div className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-center">
                  {pesoTransporte[encomenda.id]?.toFixed(2) || '0.00'} kg
                </div>
              </div>

              {/* Valor Frete */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Valor Frete</div>
                <div className="text-lg font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                  €{((pesoTransporte[encomenda.id] || 0) * 4.5).toFixed(2)}
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                <div className="bg-gray-100 rounded-lg p-2">
                  <EncomendaStatusSelect
                    encomenda={encomenda}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </div>

              {/* Comissão */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Comissão</div>
                <div className={cn(
                  "text-lg font-bold px-3 py-2 rounded-lg text-center",
                  (encomenda.commission_amount || 0) >= 0 
                    ? "text-green-600 bg-green-50" 
                    : "text-red-600 bg-red-50"
                )}>
                  {formatCurrency(encomenda.commission_amount || 0)}
                </div>
              </div>

              {/* Valor Total */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Valor Total</div>
                <div className="text-lg font-bold text-primary-dark bg-primary/10 px-3 py-2 rounded-lg text-center">
                  {formatCurrency(encomenda.valor_total)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    )}
  </div>

  {/* Dialogs */}
  <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
